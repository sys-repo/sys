import type { DenoImportMapJson } from '@sys/driver-deno/t';
import { Process } from '@sys/process';
import type * as w from '@sys/workspace/t';

import { DenoFile, describe, expect, Fs, it, makeTmpl, Templates } from '../-test.ts';
import type { t as tt } from '../m.testing/common.ts';
import { TmplTesting } from '../m.testing/mod.ts';
import { poisonSysVersions } from './u.repo.local.ts';
import { Fmt } from './u.ts';

describe('Template: repo integration', () => {
  it('generate in temp dir → deno task ci passes', async () => {
    console.info(Fmt.slowRepoWorkspaceNote());
    const tmp = await Fs.makeTempDir({ prefix: 'tmpl.repo.ci-' });
    const root = tmp.absolute;

    const def = await Templates.repo();
    const tmpl = await makeTmpl('repo');

    await tmpl.write(root, { force: true });
    await def.default(root);
    await TmplTesting.LocalRepoAuthorities.rewrite({ root });

    const res = await Process.invoke({
      cmd: 'deno',
      args: ['task', 'ci'],
      cwd: root,
      silent: true,
    });

    if (!res.success) {
      const err = `Generated repo CI failed (code ${res.code}).\n\nstdout:\n${res.text.stdout}\n\nstderr:\n${res.text.stderr}`;
      throw new Error(err);
    }
  });

  it('generate in temp dir → prep writes workspace graph snapshot', async () => {
    const tmp = await Fs.makeTempDir({ prefix: 'tmpl.repo.prep-graph-' });
    const root = tmp.absolute;
    const graphPath = Fs.join(root, '.tmp', 'workspace.graph.json');

    const tmpl = await makeTmpl('repo');

    await tmpl.write(root, { force: true });
    expect(await Fs.exists(graphPath)).to.eql(false);
    const def = await Templates.repo();
    await def.default(root);

    const graph = await Fs.readJson<w.WorkspaceGraph.Snapshot.Doc>(graphPath);
    expect(await Fs.exists(graphPath)).to.eql(true);
    expect(Array.isArray(graph.data?.graph.orderedPaths)).to.eql(true);
    expect(graph.data?.['.meta'].schemaVersion).to.eql(1);
  });

  it('generate in temp dir → repo materializes deps.yaml and upgrade dry-run runs against it', async () => {
    const tmp = await Fs.makeTempDir({ prefix: 'tmpl.repo.upgrade-' });
    const root = tmp.absolute;

    const def = await Templates.repo();
    const tmpl = await makeTmpl('repo');

    await tmpl.write(root, { force: true });
    await def.default(root);
    await TmplTesting.LocalRepoAuthorities.rewrite({ root });

    expect(await Fs.exists(Fs.join(root, 'deps.yaml'))).to.eql(true);
    expect(await Fs.exists(Fs.join(root, '-deps.yaml'))).to.eql(false);

    const res = await Process.invoke({
      cmd: 'deno',
      args: ['task', 'upgrade', '--', '--non-interactive', '--policy', 'latest', '--dry-run'],
      cwd: root,
      silent: true,
    });

    if (!res.success) {
      const err = `Generated repo upgrade failed (code ${res.code}).\n\nstdout:\n${res.text.stdout}\n\nstderr:\n${res.text.stderr}`;
      throw new Error(err);
    }

    expect(await Fs.exists(Fs.join(root, 'deps.yaml'))).to.eql(true);
    expect(await Fs.exists(Fs.join(root, '-deps.yaml'))).to.eql(false);
    expect(res.text.stdout.includes('-deps.yaml')).to.eql(false);
    expect(res.text.stderr.includes('-deps.yaml')).to.eql(false);
  });

  it('generate in temp dir → prep generates project workflows from code/projects modules', async () => {
    const tmp = await Fs.makeTempDir({ prefix: 'tmpl.repo.prep-workflows-' });
    const root = tmp.absolute;
    const path = 'code/projects/demo';
    const projectDir = Fs.join(root, path);

    const tmpl = await makeTmpl('repo');

    await tmpl.write(root, { force: true });
    await Fs.writeJson(Fs.join(projectDir, 'deno.json'), {
      tasks: {
        build: 'deno task info',
        test: 'deno task info',
      },
    });

    const def = await Templates.repo();
    await def.default(root);

    const build = (await Fs.readText(Fs.join(root, '.github/workflows/build.yaml'))).data ?? '';
    const test = (await Fs.readText(Fs.join(root, '.github/workflows/test.yaml'))).data ?? '';

    expect(build.includes(`path: ${path}`)).to.eql(true);
    expect(test.includes(`path: ${path}`)).to.eql(true);
    expect(build.includes(`name: "${path}"`)).to.eql(true);
    expect(test.includes(`name: "${path}"`)).to.eql(true);
  });

  it('generate in temp dir → generated repo pkg check passes after local authority rewrite', async () => {
    console.info(Fmt.slowRepoWorkspaceNote());
    const tmp = await Fs.makeTempDir({ prefix: 'tmpl.repo.pkg-build-' });
    const root = tmp.absolute;

    const def = await Templates.repo();
    const tmpl = await makeTmpl('repo');

    await tmpl.write(root, { force: true });
    await def.default(root);
    await TmplTesting.LocalRepoAuthorities.rewrite({ root });

    const pkgDef = await Templates.pkg();
    const pkgTmpl = await makeTmpl('pkg');
    const pkgDir = Fs.join(root, 'code', 'projects', 'foo');

    await pkgTmpl.write(pkgDir, { force: true });
    await pkgDef.default(pkgDir, { pkgName: '@tmp/foo' });

    const res = await Process.invoke({
      cmd: 'deno',
      args: ['task', 'check'],
      cwd: pkgDir,
      silent: true,
    });

    if (!res.success) {
      const err = `Generated repo pkg check failed (code ${res.code}).\n\nstdout:\n${res.text.stdout}\n\nstderr:\n${res.text.stderr}`;
      throw new Error(err);
    }
  });

  it('generate in temp dir → local authority rewrite injects local workspace authorities', async () => {
    const tmp = await Fs.makeTempDir({ prefix: 'tmpl.repo.authority-' });
    const root = tmp.absolute;

    const def = await Templates.repo();
    const tmpl = await makeTmpl('repo');

    await tmpl.write(root, { force: true });
    await def.default(root);
    await TmplTesting.LocalRepoAuthorities.rewrite({ root });

    const authorities = await TmplTesting.LocalRepoAuthorities.read(root);
    const expected = await readWorkspaceAuthorities();
    expect(authorities.imports['@sys/cli'].includes('/code/sys/cli/')).to.eql(true);
    expect(authorities.imports['@sys/std'].includes('/code/sys/std/')).to.eql(true);
    expect(authorities.imports['@sys/tmpl'].includes('/code/-tmpl/')).to.eql(true);
    expect(typeof authorities.imports['@std/testing']).to.eql('string');
    expect(authorities.imports.react).to.eql(expected.imports.react);
    expect(authorities.packageJson.dependencies?.react).to.eql(
      expected.packageJson.dependencies?.react,
    );
  });

  it('generate in temp dir → local authority rewrite survives unpublished @sys version bumps', async () => {
    console.info(Fmt.slowRepoWorkspaceNote());
    const tmp = await Fs.makeTempDir({ prefix: 'tmpl.repo.bump-' });
    const root = tmp.absolute;

    const def = await Templates.repo();
    const tmpl = await makeTmpl('repo');

    await tmpl.write(root, { force: true });
    await def.default(root);
    await poisonSysVersions(root, ['@sys/std', '@sys/testing', '@sys/tmpl']);
    await TmplTesting.LocalRepoAuthorities.rewrite({ root });

    const res = await Process.invoke({
      cmd: 'deno',
      args: ['task', 'ci'],
      cwd: root,
      silent: true,
    });

    if (!res.success) {
      const err = `Generated repo CI failed after local-authority rewrite (code ${res.code}).\n\nstdout:\n${res.text.stdout}\n\nstderr:\n${res.text.stderr}`;
      throw new Error(err);
    }
  });
});

async function readWorkspaceAuthorities(): Promise<tt.WorkspaceAuthorities> {
  const workspace = await DenoFile.workspace();
  const root = workspace.dir;
  const imports = await readJson<DenoImportMapJson>(Fs.join(root, 'imports.json'));
  const packageJson = await readJson<tt.PackageJson>(Fs.join(root, 'package.json'));

  return {
    imports: {
      ...(imports.imports ?? {}),
      react: `npm:react@${packageJson.dependencies?.react}`,
    },
    packageJson,
  };
}

async function readJson<T>(path: string): Promise<T> {
  const res = await Fs.readJson<T>(path);
  if (!res.ok || !res.data) throw new Error(`Failed to read JSON: ${path}`);
  return res.data;
}
