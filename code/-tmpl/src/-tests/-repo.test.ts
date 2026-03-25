import { type t, describe, expect, it, makeTmpl, Templates } from '../-test.ts';
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
    expect(includes('/-scripts/task.prep.ts')).to.be.true;
    expect(includes('/-scripts/task.tmpl.ts')).to.be.true;
    expect(includes('/.github/workflows/ci.yaml')).to.be.false;
    expect(includes('/.tmpl.ts')).to.be.false;
  });
});
