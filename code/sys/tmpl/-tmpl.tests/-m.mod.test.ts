import { describe, expect, Fs, it, Templates, Testing } from '../-tmpl/-test.ts';
import { setup as pkgSetup } from './-pkg.deno.test.ts';

describe('Template: m.mod', () => {
  const getDir = () => Testing.dir('m.mod.ui').create();
  const setup = async () => {
    const fs = await getDir();
    const { pkgName, pkgDir } = await pkgSetup({ fs });
    return { fs, pkgName, pkgDir } as const;
  };

  it('setup', async () => {
    const { fs, pkgDir } = await setup();
    const def = await Templates['m.mod']();

    const dir = 'src/m.MyModule';
    await def.tmpl.write(fs.join(pkgDir, dir), { afterWrite: (e) => def.default(e) });

    const glob = await Fs.glob(def.dir!).find('**', { trimCwd: true, includeDirs: false });
    const paths = glob
      .map((m) => m.path)
      .map((p) => p.slice('-tmpl/m.mod/'.length))
      .map((p) => Fs.join(pkgDir, dir, p))
      .filter((p) => !p.endsWith('/.tmpl.ts'));

    const ls = await fs.ls(true);
    for (const path of paths) {
      expect(ls.includes(path)).to.eql(true, path);
    }

    const read = async (path: string) => (await Fs.readText(fs.join(pkgDir, path))).data!;
    const typesFile = await read('src/types.ts');
    expect(typesFile).to.include(`export type * from './m.MyModule/t.ts';`);
  });
});
