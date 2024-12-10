import { describe, expect, it } from '../-test.ts';
import { SAMPLE } from './-u.ts';
import { Tmpl } from './mod.ts';

describe('Tmpl', () => {
  it('init: paths', async () => {
    const test = SAMPLE.init();
    const tmpl = Tmpl.create(test.dir.source, test.dir.target);
    expect(tmpl.source.dir).to.eql(test.dir.source);
    expect(tmpl.target.dir).to.eql(test.dir.target);
    expect(await tmpl.source.ls()).to.eql(await test.ls.source());
    expect(await tmpl.target.ls()).to.eql([]);
  });

  describe('copy', () => {
    it('copies all source files', async () => {
      const test = SAMPLE.init();
      const tmpl = Tmpl.create(test.dir.source, test.dir.target);
      expect(await tmpl.target.ls()).to.eql([]);
      await tmpl.copy();
      expect(await tmpl.target.ls()).to.eql(await test.ls.target());
    });
  });
});
