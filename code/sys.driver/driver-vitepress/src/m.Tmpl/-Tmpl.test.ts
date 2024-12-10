import { describe, expect, it } from '../-test.ts';
import { SAMPLE } from './-u.ts';
import { Tmpl } from './mod.ts';

describe('Tmpl', () => {
  it('init', () => {
    const test = SAMPLE.init();
    const tmpl = Tmpl.create(test.source, test.target);
    expect(tmpl.source.dir).to.eql(test.source);
    expect(tmpl.target.dir).to.eql(test.target);
  });
});
