import { type t, SAMPLE, describe, expect, it, pkg } from '../-test.ts';
import { Vite } from '../mod.ts';

describe('Vite: Template Generation', () => {
  const testFs = () => SAMPLE.fs('Vite.tmpl');

  const pathAssertions = (paths: t.StringPath[]) => {
    return {
      paths,
      pathExists(endsWith: t.StringPath) {
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

    expect(b.length).to.be.greaterThan(10);
    expect(a).to.eql(b);
  });

  it('--tmpl: ComponentLib', async () => {
    const fs = testFs();
    expect(await fs.ls()).to.eql([]);

    const tmpl = await Vite.Tmpl.create({ tmpl: 'ComponentLib' });
    const res = await tmpl.write(fs.dir);
    expect(res.ctx).to.eql({ version: pkg.version, tmpl: 'ComponentLib' });

    const assert = pathAssertions(await fs.ls());

  });
});
