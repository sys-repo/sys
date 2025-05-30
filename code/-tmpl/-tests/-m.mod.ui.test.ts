import { describe, expect, Fs, it, Templates, Testing, Tmpl, tmplFilter } from '../src/-test.ts';

describe('Template: m.mod.ui', () => {
  const getDir = async () => Testing.dir('m.mod.ui').create();

  it('setup: updates <root types> and <spec entry>', async () => {
    const fs = await getDir();
    const def = {
      pkg: await Templates['pkg.deno'](),
      ui: await Templates['m.mod.ui'](),
    };
    const tmpl = {
      pkg: Tmpl.create(def.pkg.dir!).filter(tmplFilter),
      ui: Tmpl.create(def.ui.dir!).filter(tmplFilter),
    };

    const path = 'src/ui/ui.FooBar';
    const name = 'MyFooBar';

    await tmpl.pkg.write(fs.dir);
    await tmpl.ui.write(fs.join(path), { onAfter: (e) => def.ui.default(e, { name }) });

    expect((await Fs.readText(fs.join('src/ui/ui.FooBar/mod.ts'))).data).to.include(name);

    const ls = await fs.ls(true);
    const paths = [
      'src/ui/ui.FooBar/-spec/-SPEC.Debug.tsx',
      'src/ui/ui.FooBar/-spec/-SPEC.tsx',
      'src/ui/ui.FooBar/common.ts',
      'src/ui/ui.FooBar/mod.ts',
      'src/ui/ui.FooBar/t.ts',
      'src/ui/ui.FooBar/ui.tsx',
    ];

    for (const path of paths) {
      expect(ls.includes(path)).to.eql(true);
    }

    const typesFile = (await Fs.readText(fs.join('src/types.ts'))).data!;
    const specsFile = (await Fs.readText(fs.join('src/-test/entry.Specs.ts'))).data!;
    expect(typesFile).to.include(`export type * from './ui/ui.FooBar/t.ts';`);

    expect(specsFile).to.include('[`${ns}: ui.FooBar`]:');
    expect(specsFile).to.include(`() => import('../ui/ui.FooBar/-spec/-SPEC.tsx'),`);
  });
});
