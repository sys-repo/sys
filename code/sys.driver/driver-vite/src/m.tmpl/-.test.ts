import { type t, SAMPLE, describe, expect, it, pkg } from '../-test.ts';
import { Vite } from '../mod.ts';

describe('Vite: Template Generation', () => {
  const testFs = () => SAMPLE.fs('Vite.tmpl');

  const pathAssertions = (paths: t.StringPath[]) => {
    return {
      paths,
      exists(endsWith: t.StringPath) {
        expect(paths.some((p) => p.endsWith(endsWith))).to.eql(true);
      },
    } as const;
  };

  it('--tmpl: Default', async () => {
    const fs = testFs();
    expect(await fs.ls()).to.eql([]);

    const tmpl = await Vite.Tmpl.create();
    const res = await tmpl.write(fs.dir);
    expect(res.ctx).to.eql({ version: pkg.version, tmpl: 'Default' });

    const a = (await fs.ls()).toSorted();
    const b = (await res.target.ls()).toSorted();
    expect(a).to.eql(b);

    const assert = pathAssertions(a);
    [
      '-scripts/-tmp.ts',
      '.gitignore',
      '.npmrc',
      '.vscode/settings.json',
      'README.md',
      'deno.json',
      'imports.json',
      'src/-test.ts',
      'src/-test/-sample/m.Foo.ts',
      'src/-test/-sample/t.ts',
      'src/-test/-sample/ui.Foo.tsx',
      'src/-test/entry.tsx',
      'src/-test/index.html',
      'src/-test/mod.ts',
      'src/.test.ts',
      'src/common.ts',
      'src/common/libs.ts',
      'src/common/mod.ts',
      'src/common/t.ts',
      'src/mod.ts',
      'src/pkg.ts',
      'src/types.ts',
      'vite.config.ts',
    ].forEach((path) => assert.exists(path));
  });

  it('--tmpl: ComponentLib', async () => {
    const fs = testFs();
    expect(await fs.ls()).to.eql([]);

    const tmpl = await Vite.Tmpl.create({ tmpl: 'ComponentLib' });
    const res = await tmpl.write(fs.dir);
    expect(res.ctx).to.eql({ version: pkg.version, tmpl: 'ComponentLib' });

    const a = (await fs.ls()).toSorted();
    const b = (await res.target.ls()).toSorted();
    expect(a).to.eql(b);

    const assert = pathAssertions(a);
    [
      '-scripts/-tmp.ts',
      '.gitignore',
      '.npmrc',
      '.vscode/settings.json',
      'README.md',
      'deno.json',
      'imports.json',
      'src/-test.ts',
      'src/-test/-sample/m.Foo.ts',
      'src/-test/-sample/t.ts',
      'src/-test/-sample/ui.Foo.tsx',
      'src/-test/entry.tsx',
      'src/-test/index.html',
      'src/-test/mod.ts',
      'src/.test.ts',
      'src/common.ts',
      'src/common/libs.ts',
      'src/common/mod.ts',
      'src/common/t.ts',
      'src/mod.ts',
      'src/pkg.ts',
      'src/types.ts',
      'vite.config.ts',
    ].forEach((path) => assert.exists(path));
  });
});
