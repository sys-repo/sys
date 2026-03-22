import { type t, describe, expect, Fs, it, makeTmpl, Templates } from '../-test.ts';
import { logTemplate, makeWorkspace } from './u.ts';

describe('Template: pkg', () => {
  it('run', async () => {
    /**
     * Template setup:
     */
    const ns = 'ns';
    const test = await makeWorkspace({
      workspace: ['code/zns/zed', 'code/ans/alpha'],
    });
    const name: t.TemplateName = 'pkg';
    const def = await Templates[name]();
    const tmpl = await makeTmpl(name);

    const dirA = Fs.join(test.root, 'code', 'ns', 'foo-1');
    const dirB = Fs.join(test.root, 'code', 'ns', 'foo-2');

    // Write → init (CLI flow)
    const resA = await tmpl.write(dirA);
    const resB = await tmpl.write(dirB);

    await def.default(dirA, { pkgName: '@my-scope/foo-1' });
    await def.default(dirB, { pkgName: '@my-scope/foo-2' });

    logTemplate('pkg', resA, { titleSuffix: '| foo-1' });
    logTemplate('pkg', resB, { titleSuffix: '| foo-2' });

    const ls = await test.ls();
    const includes = (endsWith: t.StringPath) => !!ls.find((p) => p.endsWith(endsWith));

    /**
     * Assertions:
     */
    expect(includes('/ns/foo-1/deno.json')).to.be.true;

    // Text replacements:
    {
      const glob = Fs.glob(dirA, { includeDirs: false });
      const files = (await glob.find('**')).map((m) => m.path);

      const texts = await Promise.all(files.map(async (p) => (await Fs.readText(p)).data ?? ''));
      const blob = texts.join('\n');
      expect(blob.includes('@sample/foo-1')).to.eql(false, 'should replace all @sample/foo');
      expect(blob.includes('@my-scope/foo-1')).to.eql(true, 'should insert provided pkgName');
    }

    // Workspace update: `deno.json` workspace should now include a new comma-terminated entry
    {
      const path = `${test.root}/deno.json`;
      const workspaceDeno = (await Fs.readText(path)).data!;
      expect(workspaceDeno).to.include(`"workspace": [`);
      const json = (await Fs.readJson<{ workspace?: string[] }>(path)).data!;
      expect(json.workspace).to.eql([
        'code/ans/alpha',
        'code/ns/foo-1',
        'code/ns/foo-2',
        'code/zns/zed',
      ]);
    }
  });
});
