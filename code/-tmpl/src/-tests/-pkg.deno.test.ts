import { type t, describe, expect, Fs, it, makeTmpl, Templates } from '../-test.ts';
import { logTemplate, makeWorkspace } from './u.ts';

describe('Template: pkg.deno', () => {
  it('run', async () => {
    /**
     * Template setup:
     */
    const test = await makeWorkspace('ns', 'my-module');
    const name: t.TemplateName = 'pkg.deno';
    const def = await Templates[name]();
    const tmpl = await makeTmpl(name);

    // Write → init (CLI flow)
    const res = await tmpl.write(test.pkgDir);
    await def.default(test.pkgDir, { pkgName: '@my-scope/foo' });
    logTemplate('pkg.deno', res);

    const ls = await test.ls();
    const includes = (endsWith: t.StringPath) => !!ls.find((p) => p.endsWith(endsWith));

    /**
     * Assertions:
     */
    expect(includes('/ns/my-module/deno.json')).to.be.true;
    expect(includes('/ns/my-module/-deno.json')).to.be.false; // renamed.

    // Text replacements:
    {
      const glob = Fs.glob(test.pkgDir, { includeDirs: false });
      const files = (await glob.find('**')).map((m) => m.path);

      const texts = await Promise.all(files.map(async (p) => (await Fs.readText(p)).data ?? ''));
      const blob = texts.join('\n');
      expect(blob.includes('@sample/foo')).to.eql(false, 'should replace all @sample/foo');
      expect(blob.includes('@my-scope/foo')).to.eql(true, 'should insert provided pkgName');
    }

    // Workspace update: `deno.json` workspace should now include a new comma-terminated entry
    {
      const path = `${test.root}/deno.json`;
      const workspaceDeno = (await Fs.readText(path)).data!;
      expect(workspaceDeno).to.include(`"workspace": [`);
      expect(workspaceDeno).to.include(`"code/ns/my-module",`);
    }
  });
});
