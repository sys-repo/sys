import { describe, expect, Fs, it, Templates, Testing, Tmpl, tmplFilter } from '../src/-test.ts';

describe('Template: m.mod.ui', () => {
  const getDir = async () => Testing.dir('m.mod.ui').create();

  it('setup: updates <component name>, <root types> and <spec entry>', async () => {
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

    const glob = await Fs.glob(def.ui.dir!).find('**', { trimCwd: true, includeDirs: false });
    const paths = glob
      .map((m) => m.path.slice('src/m.mod.ui/'.length))
      .map((p) => `${path}/${p}`)
      .filter((p) => !p.endsWith('/.tmpl.ts'));

    const ls = await fs.ls(true);
    for (const path of paths) {
      expect(ls.includes(path)).to.eql(true, path);
    }

    const typesFile = (await Fs.readText(fs.join('src/types.ts'))).data!;
    expect(typesFile).to.include(`export type * from './ui/ui.FooBar/t.ts';`);

    const specsFile = (await Fs.readText(fs.join('src/-test/entry.Specs.ts'))).data!;
    expect(specsFile).to.include('[`${ns}: ui.FooBar`]:');
    expect(specsFile).to.include(`() => import('../ui/ui.FooBar/-spec/-SPEC.tsx'),`);
  });
});
