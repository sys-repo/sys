import { describe, expect, it, TestPrint } from '../-test.ts';
import { CssEdges } from '../m.Css.Edges/mod.ts';
import { CssTmpl } from '../m.Css.Tmpl/mod.ts';
import { Color, css, Style } from '../mod.ts';
import { CssDom, DEFAULT, Str } from './common.ts';
import { transformer } from './u.transform.ts';

describe('Style', () => {
  it('API', () => {
    expect(Style.Color).to.equal(Color);
    expect(Style.Dom).to.equal(CssDom);
    expect(Style.Tmpl).to.eql(CssTmpl);

    expect(Style.css).to.equal(css);
    expect(Style.transformer).to.equal(transformer);

    expect(Style.Edges).to.equal(CssEdges);
    expect(Style.toMargins).to.equal(CssEdges.toMargins);
    expect(Style.toPadding).to.equal(CssEdges.toPadding);
  });

  describe('Style.toString', () => {
    it('invalid → "" (empty)', () => {
      const NON = ['', 123, true, null, undefined, BigInt(0), Symbol('foo'), []];
      NON.forEach((value: any) => {
        expect(Style.toString(value)).to.eql('', value);
      });
    });

    it('empty style: {} → ""', () => {
      expect(Style.toString({})).to.eql('');
    });

    it('simple', () => {
      const res = Style.toString({ fontSize: 32, fontFamily: 'sans-serif' });
      expect(res).to.eql('font-size: 32px; font-family: sans-serif;');
    });

    it('number to "px" pixels', () => {
      Array.from(DEFAULT.pixelProps).forEach((prop) => {
        const res = Style.toString({ [prop]: 10 });
        const key = Str.camelToKebab(prop);
        expect(res).to.eql(`${key}: 10px;`);
      });
    });
  });

  describe('Style.transformer ← factory', () => {
    it('ƒn: transformer ← <default> class-name prefix', () => {
      const css = Style.transformer();
      const m = css({ display: 'grid' });
      expect(m.class.startsWith(`${DEFAULT.prefix}-`)).to.be.true;
      TestPrint.transformed(m);
    });

    it('ƒn: transformer ← <custom> class-name prefix', () => {
      const css = Style.transformer({ prefix: 'foo' });
      const m = css({ display: 'grid' });
      expect(m.class.startsWith(`foo-`)).to.be.true;
      TestPrint.transformed(m);
    });
  });
});
