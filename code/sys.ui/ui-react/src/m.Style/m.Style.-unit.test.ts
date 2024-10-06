import { describe, expect, it } from '../-test.ts';
import { Style } from './mod.ts';

describe('Style', () => {
  it('Style.plugin.emotion() ← react ← @emotion (css-in-js)', () => {
    const res = Style.plugin.emotion();
    expect(res.jsxImportSource).to.eql('@emotion/react');
    expect(res.plugins[0][0]).to.eql('@swc/plugin-emotion');
  });
});
