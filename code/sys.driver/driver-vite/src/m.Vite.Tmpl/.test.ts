import { SAMPLE, describe, expect, it } from '../-test.ts';
import { Vite } from '../mod.ts';

describe('Vite: Template Generation', () => {
  it('inserts template', async () => {
    const fs = SAMPLE.fs('Vite.tmpl');
    expect(await fs.ls()).to.eql([]);

    const tmpl = await Vite.Tmpl.create();
    const res = await tmpl.write(fs.dir);

    const a = (await fs.ls()).toSorted();
    const b = (await res.target.ls()).toSorted();

    expect(b.length).to.be.greaterThan(10);
    expect(a).to.eql(b);
  });
});
