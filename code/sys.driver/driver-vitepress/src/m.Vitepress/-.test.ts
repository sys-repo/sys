import { describe, expect, it } from '../-test.ts';
import { VitepressTmpl } from '../m.Vitepress.Tmpl/mod.ts';
import { Vitepress } from './mod.ts';

describe('Vitepress', () => {
  it('API', () => {
    expect(Vitepress.Tmpl).to.equal(VitepressTmpl);
  });
});
