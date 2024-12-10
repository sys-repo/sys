import { describe, it, expect, type t } from '../-test.ts';
import { Tmpl } from './mod.ts';
import { SAMPLE } from './-u.ts';

describe('Tmpl', () => {
  it('init', () => {
    const test = SAMPLE.init();
    const tmpl = Tmpl.create(test.source);
    expect(tmpl.source).to.eql(test.source);
  });
});
