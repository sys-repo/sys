import { describe, expect, it } from '../../-test.ts';
import { Tmpl } from './m.Tmpl.ts';
import { Style, css } from './mod.ts';

describe('Style', () => {
  it('API', () => {
    expect(Style.css).to.equal(css);
    expect(Style.Tmpl).to.equal(Tmpl);
  });

  it('Style.plugin.emotion() ← react ← @emotion (css-in-js)', () => {
    const res = Style.plugin.emotion();
    expect(res.jsxImportSource).to.eql('@emotion/react');
    expect(res.plugins[0][0]).to.eql('@swc/plugin-emotion');
  });
});
