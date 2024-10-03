import { describe, expect, it } from '../-test.ts';
import { Css } from './mod.ts';

describe('Css', () => {
  it('exists', () => {
    expect(Css).to.to.exist;
  });

  it('plugin: react', () => {
    const res = Css.pluginOptions();
    expect(res.jsxImportSource).to.eql('@emotion/react');
    expect(res.plugins[0][0]).to.eql('@swc/plugin-emotion');
  });
});
