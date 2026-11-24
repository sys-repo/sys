import type * as TDenoFile from '@sys/driver-deno/t';
import { Process } from '@sys/process';
import { Workspace } from '@sys/workspace/testing';

import { DenoFile, describe, expect, Fs, it, makeTmpl, Templates } from '../-test.ts';
import type { t as tt } from '../m.testing/common.ts';
import { TmplTesting } from '../m.testing/mod.ts';
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

    const testBarrel = (await Fs.readText(Fs.join(root, 'code/common/-test.ts'))).data ?? '';
    expect(testBarrel.includes('DomMock')).to.eql(false);

    const res = await Process.invoke({
      cmd: 'deno',
      args: ['task', 'ci'],
      cwd: root,
      silent: true,
    });

    if (!res.success) {
      const err =
        `Generated repo CI failed (code ${res.code}).\n\nstdout:\n${res.text.stdout}\n\nstderr:\n${res.text.stderr}`;
      throw new Error(err);
    }
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
      const err =
        `Generated repo upgrade failed (code ${res.code}).\n\nstdout:\n${res.text.stdout}\n\nstderr:\n${res.text.stderr}`;
      throw new Error(err);
    }

    expect(await Fs.exists(Fs.join(root, 'deps.yaml'))).to.eql(true);
    expect(await Fs.exists(Fs.join(root, '-deps.yaml'))).to.eql(false);
    expect(res.text.stdout.includes('-deps.yaml')).to.eql(false);
    expect(res.text.stderr.includes('-deps.yaml')).to.eql(false);
  });

  it('generate in temp dir → prep generates package workflows from code/packages modules', async () => {
    const tmp = await Fs.makeTempDir({ prefix: 'tmpl.repo.prep-workflows-' });
    const root = tmp.absolute;
    const path = 'code/packages/demo';
    const packageDir = Fs.join(root, path);

    const tmpl = await makeTmpl('repo');

    await tmpl.write(root, { force: true });
    await Fs.writeJson(Fs.join(packageDir, 'deno.json'), {
      tasks: {
        build: 'deno task info',
        test: 'deno task info',
      },
    });

    const def = await Templates.repo();
    await def.default(root);

    const build = (await Fs.readText(Fs.join(root, '.github/workflows/build.yaml'))).data ?? '';
    const test = (await Fs.readText(Fs.join(root, '.github/workflows/test.linux.yaml'))).data ?? '';

    expect(build.includes(`path: ${path}`)).to.eql(true);
    expect(test.includes(`path: ${path}`)).to.eql(true);
    expect(build.includes(`name: "${path}"`)).to.eql(true);
    expect(test.includes(`name: "${path}"`)).to.eql(true);
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
    expect(authorities.imports['@std/testing']).to.eql(undefined);
    expect(authorities.imports['@std/testing/bdd']).to.eql(undefined);
    expect(authorities.imports.react).to.eql(expected.imports.react);
    expect(authorities.packageJson.dependencies?.react).to.eql(
      expected.packageJson.dependencies?.react,
    );
  });
});

it('generated repo → deno task prep writes a valid graph and restores canonical imports', async () => {
  const tmp = await Fs.makeTempDir({ prefix: 'tmpl.repo.prep-' });
  const root = tmp.absolute;
  try {
    const tmpl = await makeTmpl('repo');
    await tmpl.write(root, { force: true });
    await TmplTesting.LocalRepoAuthorities.rewrite({ root });

    expect(await Fs.exists(Workspace.Prep.State.graphFile(root))).to.eql(false);
    await Workspace.Test.scripts(root);

    type ImportMap = TDenoFile.DenoFile.ImportMap.Json;
    const { imports } = await readJson<ImportMap>(tmp.join('imports.json'));
    const template = await readJson<ImportMap>(
      Fs.resolve(import.meta.dirname ?? '.', '../../-templates/tmpl.repo/imports.json'),
    );
    expect(imports?.['@sys/tmpl']).to.eql(template.imports?.['@sys/tmpl']);
    expect(imports?.['@sys/workspace']).to.eql(template.imports?.['@sys/workspace']);
    const deno = imports?.['@sys/driver-deno'];
    const workspace = imports?.['@sys/workspace'];
    expect(imports?.['@sys/driver-deno/runtime']).to.eql(`${deno}/runtime`);
    expect(imports?.['@sys/workspace/cli']).to.eql(`${workspace}/cli`);
    expect(imports?.['@sys/workspace/testing']).to.eql(`${workspace}/testing`);
  } finally {
    await Fs.remove(root);
  }
});

async function readWorkspaceAuthorities(): Promise<tt.WorkspaceAuthorities> {
  const workspace = await DenoFile.workspace();
  const root = workspace.dir;
  const imports = await readJson<TDenoFile.DenoFile.ImportMap.Json>(Fs.join(root, 'imports.json'));
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
