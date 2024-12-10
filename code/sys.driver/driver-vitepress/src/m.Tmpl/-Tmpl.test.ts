import { describe, expect, it } from '../-test.ts';
import { SAMPLE } from './-u.ts';
import { Tmpl } from './mod.ts';

describe('Tmpl', () => {
  it('init: paths', async () => {
    const test = SAMPLE.init();
    const tmpl = Tmpl.create(test.source, test.target);
    expect(tmpl.source.dir).to.eql(test.source);
    expect(tmpl.target.dir).to.eql(test.target);
    expect(await tmpl.source.ls()).to.eql(await test.ls.source());
    expect(await tmpl.target.ls()).to.eql([]);
  });

  describe('copy', () => {
    it('copies all source files', async () => {
      const test = SAMPLE.init();
      const tmpl = Tmpl.create(test.source, test.target);
      expect(await tmpl.target.ls()).to.eql([]);
      await tmpl.copy();
      expect(await tmpl.target.ls()).to.eql(await test.ls.target());
    });
  });
});
