import { type t, describe, expect, Fs, it, makeTmpl, Templates } from '../-test.ts';
import { TmplTesting } from '../m.testing/mod.ts';
import { logTemplate, makeWorkspace } from './u.ts';
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
    const tmp = await Fs.makeTempDir({ prefix: 'tmpl.repo.ci-' });
    const root = tmp.absolute;

    const def = await Templates.repo();
    const tmpl = await makeTmpl('repo');

    await tmpl.write(root, { force: true });
    await def.default(root);
    await TmplTesting.LocalRepoAuthorities.rewrite({ root });

    const cmd = new Deno.Command('deno', {
      args: ['task', 'ci'],
      cwd: root,
      stdout: 'piped',
      stderr: 'piped',
    });
    const res = await cmd.output();
    const out = new TextDecoder().decode(res.stdout);
    const err = new TextDecoder().decode(res.stderr);

    if (!res.success) {
      throw new Error(`Generated repo CI failed (code ${res.code}).\n\nstdout:\n${out}\n\nstderr:\n${err}`);
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
    expect(authorities.imports['@sys/cli'].includes('/code/sys/cli/')).to.eql(true);
    expect(authorities.imports['@sys/std'].includes('/code/sys/std/')).to.eql(true);
    expect(authorities.imports['@sys/tmpl'].includes('/code/-tmpl/')).to.eql(true);
    expect(typeof authorities.imports['@std/testing']).to.eql('string');
    expect(authorities.imports['react']).to.eql('npm:react@19.2.4');
    expect(authorities.packageJson.dependencies?.react).to.eql('19.2.4');
  });

  it('generate in temp dir → local authority rewrite survives unpublished @sys version bumps', async () => {
    const tmp = await Fs.makeTempDir({ prefix: 'tmpl.repo.bump-' });
    const root = tmp.absolute;

    const def = await Templates.repo();
    const tmpl = await makeTmpl('repo');

    await tmpl.write(root, { force: true });
    await def.default(root);
    await poisonSysVersions(root, ['@sys/std', '@sys/testing', '@sys/tmpl']);
    await TmplTesting.LocalRepoAuthorities.rewrite({ root });

    const cmd = new Deno.Command('deno', {
      args: ['task', 'ci'],
      cwd: root,
      stdout: 'piped',
      stderr: 'piped',
    });
    const res = await cmd.output();
    const out = new TextDecoder().decode(res.stdout);
    const err = new TextDecoder().decode(res.stderr);

    if (!res.success) {
      throw new Error(
        `Generated repo CI failed after local-authority rewrite (code ${res.code}).\n\nstdout:\n${out}\n\nstderr:\n${err}`,
      );
    }
  });
});
