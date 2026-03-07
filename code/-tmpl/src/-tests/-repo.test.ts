import { type t, describe, expect, Fs, it, makeTmpl, Templates } from '../-test.ts';
import { logTemplate, makeWorkspace } from './u.ts';

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
    expect(includes('/-scripts/tmpl.ts')).to.be.true;
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
});
