import { describe, expect, it } from '../-test.ts';
import { VitepressTmpl } from '../m.Vitepress.Tmpl/mod.ts';
import { VitePress } from './mod.ts';

describe('Vitepress', () => {
  it('API', () => {
    expect(VitePress.Tmpl).to.equal(VitepressTmpl);
  });
});
