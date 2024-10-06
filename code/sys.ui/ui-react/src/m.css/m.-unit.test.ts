import { describe, expect, it } from '../-test.ts';
import { Style } from './mod.ts';

describe('Style', () => {
  it('Style.pluginOptions ← react ← @emotion (css-in-js)', () => {
    const res = Style.pluginOptions();
    expect(res.jsxImportSource).to.eql('@emotion/react');
    expect(res.plugins[0][0]).to.eql('@swc/plugin-emotion');
  });
});
