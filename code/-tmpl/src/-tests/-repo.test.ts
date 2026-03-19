import { Process } from '@sys/process';

import { DenoFile, type t, describe, expect, Fs, it, makeTmpl, Templates } from '../-test.ts';
import { TmplTesting } from '../m.testing/mod.ts';
import { Fmt, logTemplate, makeWorkspace } from './u.ts';
import { poisonSysVersions } from './u.repo.local.ts';

describe('Template: repo', () => {
  it('run', async () => {
    /**
     * Template setup:
     */
    const test = await makeWorkspace();
    const name: t.TemplateName = 'repo';
    const def = await Templates[name]();
    const tmpl = await makeTmpl(name);

    const targetDir = test.root;

    // Write → init (CLI flow)
    const res = await tmpl.write(targetDir, { force: true });
    await def.default(targetDir);
    logTemplate('repo', res);

    const ls = await test.ls();
    const includes = (endsWith: t.StringPath) => !!ls.find((p) => p.endsWith(endsWith));

    /**
     * Assertions:
     */
    expect(includes('/deno.json')).to.be.true;
    expect(includes('/imports.json')).to.be.true;
    expect(includes('/README.md')).to.be.true;
    expect(includes('/code/projects/mod.ts')).to.be.true;
    expect(includes('/-scripts/task.prep.ts')).to.be.true;
    expect(includes('/-scripts/task.tmpl.ts')).to.be.true;
    expect(includes('/.github/workflows/ci.yaml')).to.be.false;
    expect(includes('/.tmpl.ts')).to.be.false;
  });
});

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
      throw new Error(
        `Generated repo CI failed (code ${res.code}).\n\nstdout:\n${res.text.stdout}\n\nstderr:\n${res.text.stderr}`,
      );
    }
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
      throw new Error(
        `Generated repo pkg check failed (code ${res.code}).\n\nstdout:\n${res.text.stdout}\n\nstderr:\n${res.text.stderr}`,
      );
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
    expect(authorities.packageJson.dependencies?.react).to.eql(expected.packageJson.dependencies?.react);
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
      throw new Error(
        `Generated repo CI failed after local-authority rewrite (code ${res.code}).\n\nstdout:\n${res.text.stdout}\n\nstderr:\n${res.text.stderr}`,
      );
    }
  });
});

async function readWorkspaceAuthorities() {
  const workspace = await DenoFile.workspace();
  const root = workspace.dir;
  const imports = await readJson<{ readonly imports: Record<string, string> }>(Fs.join(root, 'imports.json'));
  const packageJson = await readJson<{
    readonly dependencies?: Record<string, string>;
    readonly devDependencies?: Record<string, string>;
  }>(Fs.join(root, 'package.json'));

  return {
    imports: {
      ...imports.imports,
      react: `npm:react@${packageJson.dependencies?.react}`,
    },
    packageJson,
  };
}

async function readJson<T>(path: string): Promise<T> {
  const res = await Fs.readJson(path);
  if (!res.ok || !res.data) throw new Error(`Failed to read JSON: ${path}`);
  return res.data as T;
}
