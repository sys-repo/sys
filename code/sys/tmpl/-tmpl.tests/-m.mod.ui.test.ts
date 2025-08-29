import { describe, expect, it, Templates, Testing } from '../src/-test.ts';
import { setup as pkgSetup } from './-pkg.deno.test.ts';
import { Fs } from './common.ts';

describe('Template: m.mod.ui', () => {
  const getDir = () => Testing.dir('m.mod.ui').create();
  const setup = async () => {
    const fs = await getDir();
    const { pkgName, pkgDir } = await pkgSetup({ fs });
    return { fs, pkgName, pkgDir } as const;
  };

  it('setup', async () => {
    const { fs, pkgDir } = await setup();
    const def = await Templates['m.mod.ui']();

    const name = 'MyFooBar';
    const dir = 'src/ui/ui.FooBar';
    await def.tmpl.write(fs.join(pkgDir, dir), { afterWrite: (e) => def.default(e, { name }) });

    const glob = await Fs.glob(def.dir!).find('**', { trimCwd: true, includeDirs: false });
    const paths = glob
      .map((m) => m.path)
      .map((p) => p.slice('src/-tmpl/m.mod.ui/'.length))
      .map((p) => Fs.join(pkgDir, dir, p))
      .filter((p) => !p.endsWith('/.tmpl.ts'));

    const ls = await fs.ls(true);
    for (const path of paths) {
      expect(ls.includes(path)).to.eql(true, path);
    }

    const read = async (path: string) => (await Fs.readText(fs.join(pkgDir, path))).data!;
    const typesFile = await read('src/types.ts');
    expect(typesFile).to.include(`export type * from './ui/ui.FooBar/t.ts';`);

    const specsFile = await read('src/-test/-specs.ts');
    expect(specsFile).to.include('[`${ns}: ui.FooBar`]:');
    expect(specsFile).to.include(`() => import('../ui/ui.FooBar/-spec/-SPEC.tsx'),`);
  });
});
