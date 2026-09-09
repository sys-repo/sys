import { describe, expect, expectError, Fs, it, Testing } from '../-test.ts';
import { resolveWorkspaceManifestPath, resolveWorkspaceMembers } from '../u.workspace.members.ts';

describe('Workspace members', () => {
  it('loads root and child JSON manifests in declared workspace order', async () => {
    const fs = await Testing.dir('WorkspaceMembers.json');
    await writeWorkspace(fs.dir, ['code/pkg-b', 'code/pkg-a']);
    await writePackage(fs.dir, 'code/pkg-b', '@scope/b');
    await writePackage(fs.dir, 'code/pkg-a', '@scope/a');

    const root = await Fs.realPath(fs.dir);
    const result = await resolveWorkspaceMembers(Fs.join(fs.dir, 'deno.json'));

    expect(result.root).to.eql(root);
    expect(result.manifestPath).to.eql(Fs.join(fs.dir, 'deno.json'));
    expect(result.members).to.eql([
      {
        path: 'code/pkg-b',
        root: Fs.join(root, 'code/pkg-b'),
        manifestPath: Fs.join(fs.dir, 'code/pkg-b', 'deno.json'),
        manifest: { name: '@scope/b', version: '1.0.0' },
      },
      {
        path: 'code/pkg-a',
        root: Fs.join(root, 'code/pkg-a'),
        manifestPath: Fs.join(fs.dir, 'code/pkg-a', 'deno.json'),
        manifest: { name: '@scope/a', version: '1.0.0' },
      },
    ]);
  });

  it('loads a child deno.jsonc manifest when deno.json is absent', async () => {
    const fs = await Testing.dir('WorkspaceMembers.jsonc');
    await writeWorkspace(fs.dir, ['code/pkg']);
    await Fs.write(
      Fs.join(fs.dir, 'code/pkg/deno.jsonc'),
      '{\n  // package manifest\n  "name": "@scope/pkg",\n  "version": "1.0.0"\n}\n',
    );

    const root = await Fs.realPath(fs.dir);
    const result = await resolveWorkspaceMembers(Fs.join(fs.dir, 'deno.json'));

    expect(result.members[0]).to.eql({
      path: 'code/pkg',
      root: Fs.join(root, 'code/pkg'),
      manifestPath: Fs.join(fs.dir, 'code/pkg', 'deno.jsonc'),
      manifest: { name: '@scope/pkg', version: '1.0.0' },
    });
  });

  it('loads the exact configured root manifest when JSON and JSONC both exist', async () => {
    const fs = await Testing.dir('WorkspaceMembers.root-authority');
    await writeWorkspace(fs.dir, ['code/json']);
    await writeWorkspace(fs.dir, ['code/jsonc'], 'deno.jsonc');
    await writePackage(fs.dir, 'code/json', '@scope/json');
    await writePackage(fs.dir, 'code/jsonc', '@scope/jsonc');

    const result = await resolveWorkspaceMembers(Fs.join(fs.dir, 'deno.jsonc'));

    expect(await resolveWorkspaceManifestPath(fs.dir)).to.eql(Fs.join(fs.dir, 'deno.json'));
    expect(result.manifestPath).to.eql(Fs.join(fs.dir, 'deno.jsonc'));
    expect(result.members.map((member) => member.path)).to.eql(['code/jsonc']);
  });

  it('resolves a root deno.jsonc manifest when deno.json is absent', async () => {
    const fs = await Testing.dir('WorkspaceMembers.root-jsonc');
    await writeWorkspace(fs.dir, ['code/pkg'], 'deno.jsonc');

    const result = await resolveWorkspaceManifestPath(fs.dir);

    expect(result).to.eql(Fs.join(fs.dir, 'deno.jsonc'));
  });

  it('preserves declared member identity while returning its canonical root', async () => {
    const fs = await Testing.dir('WorkspaceMembers.alias');
    await writeWorkspace(fs.dir, ['code/alias']);
    await writePackage(fs.dir, 'code/pkg', '@scope/pkg');
    await Deno.symlink(Fs.join(fs.dir, 'code/pkg'), Fs.join(fs.dir, 'code/alias'), { type: 'dir' });

    const root = await Fs.realPath(fs.dir);
    const result = await resolveWorkspaceMembers(Fs.join(fs.dir, 'deno.json'));

    expect(result.members[0]).to.eql({
      path: 'code/alias',
      root: Fs.join(root, 'code/pkg'),
      manifestPath: Fs.join(fs.dir, 'code/alias', 'deno.json'),
      manifest: { name: '@scope/pkg', version: '1.0.0' },
    });
  });

  it('rejects an empty workspace list', async () => {
    const fs = await Testing.dir('WorkspaceMembers.empty');
    await writeWorkspace(fs.dir, []);

    await expectError(
      () => resolveWorkspaceMembers(Fs.join(fs.dir, 'deno.json')),
      'Workspace manifest member list must contain at least one string path',
    );
  });

  it('rejects a workspace list containing non-string paths', async () => {
    const fs = await Testing.dir('WorkspaceMembers.malformed');
    await Fs.writeJson(Fs.join(fs.dir, 'deno.json'), { workspace: ['code/pkg', 1] });

    await expectError(
      () => resolveWorkspaceMembers(Fs.join(fs.dir, 'deno.json')),
      'Workspace manifest member list must contain at least one string path',
    );
  });

  it('rejects blank workspace member paths', async () => {
    for (const [index, path] of ['', '  '].entries()) {
      const fs = await Testing.dir(`WorkspaceMembers.blank-${index}`);
      await writeWorkspace(fs.dir, [path]);

      await expectError(
        () => resolveWorkspaceMembers(Fs.join(fs.dir, 'deno.json')),
        'Workspace member path must not be blank',
      );
    }
  });

  it('rejects workspace entries that resolve to the workspace root', async () => {
    const fs = await Testing.dir('WorkspaceMembers.root-entry');
    await writeWorkspace(fs.dir, ['.']);

    await expectError(
      () => resolveWorkspaceMembers(Fs.join(fs.dir, 'deno.json')),
      'must resolve beneath workspace root',
    );
  });

  it('rejects a missing authoritative root manifest with its exact path', async () => {
    const fs = await Testing.dir('WorkspaceMembers.missing-root');
    const manifestPath = Fs.join(fs.dir, 'deno.json');

    await expectError(
      () => resolveWorkspaceMembers(manifestPath),
      `Workspace manifest does not exist: ${manifestPath}`,
    );
  });

  it('rejects missing workspace members', async () => {
    const fs = await Testing.dir('WorkspaceMembers.missing');
    await writeWorkspace(fs.dir, ['code/missing']);

    await expectError(
      () => resolveWorkspaceMembers(Fs.join(fs.dir, 'deno.json')),
      'Could not resolve workspace member',
    );
  });

  it('rejects malformed child manifests with their exact path', async () => {
    const fs = await Testing.dir('WorkspaceMembers.malformed-child');
    const manifestPath = Fs.join(fs.dir, 'code/pkg/deno.json');
    await writeWorkspace(fs.dir, ['code/pkg']);
    await Fs.write(manifestPath, '{');

    await expectError(
      () => resolveWorkspaceMembers(Fs.join(fs.dir, 'deno.json')),
      `Workspace manifest is invalid: ${manifestPath}`,
    );
  });

  it('reports invalid members in declared order', async () => {
    const fs = await Testing.dir('WorkspaceMembers.failure-order');
    await writeWorkspace(fs.dir, ['code/missing', '../outside']);

    await expectError(
      () => resolveWorkspaceMembers(Fs.join(fs.dir, 'deno.json')),
      'Could not resolve workspace member: code/missing',
    );
  });

  it('rejects workspace members that lexically escape the root', async () => {
    const fs = await Testing.dir('WorkspaceMembers.escape');
    await writeWorkspace(fs.dir, ['../outside']);

    await expectError(
      () => resolveWorkspaceMembers(Fs.join(fs.dir, 'deno.json')),
      'escapes workspace root',
    );
  });

  it('rejects workspace members that escape the root through a symlink', async () => {
    const fs = await Testing.dir('WorkspaceMembers.symlink-escape');
    const outside = await Testing.dir('WorkspaceMembers.symlink-escape.outside');
    await writeWorkspace(fs.dir, ['code/pkg']);
    await writePackage(outside.dir, '.', '@scope/outside');
    await Fs.write(Fs.join(fs.dir, 'code/.keep'), '');
    await Deno.symlink(outside.dir, Fs.join(fs.dir, 'code/pkg'), { type: 'dir' });

    await expectError(
      () => resolveWorkspaceMembers(Fs.join(fs.dir, 'deno.json')),
      'escapes workspace root through symlink: code/pkg',
    );
  });
});

async function writeWorkspace(
  cwd: string,
  workspace: readonly string[],
  filename = 'deno.json',
) {
  await Fs.writeJson(Fs.join(cwd, filename), { workspace: [...workspace] });
}

async function writePackage(cwd: string, path: string, name: string) {
  await Fs.writeJson(Fs.join(cwd, path, 'deno.json'), { name, version: '1.0.0' });
}
