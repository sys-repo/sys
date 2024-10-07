import { describe, expect, it, type t } from '../-test.ts';
import { Emotion } from './lib.emotion-js/mod.ts';
import { Style, css } from './mod.ts';
import { Is } from './u.ts';

describe('Style', () => {
  it('API', () => {
    expect(Style.css).to.equal(css);
  });

  it('Style.plugin.emotion() ← react ← @emotion (css-in-js)', () => {
    const res = Style.plugin.emotion();
    expect(res.jsxImportSource).to.eql('@emotion/react');
    expect(res.plugins[0][0]).to.eql('@swc/plugin-emotion');
  });

  describe('Style.css ← transform', () => {
    it('simple', () => {
      const res = Style.css({ fontSize: 16 });
      expect(res.css.styles).to.include('font-size:16px;');
    });

    it('basic merge', () => {
      const a = Style.css({ color: 'red' });
      const b = css({ background: 'blue' });

      const res = Style.css(a, b);
      expect(res.css.styles).to.include('color:red;');
      expect(res.css.styles).to.include('background:blue;');
    });

    it('deep merge', () => {
      const props = { style: { color: 'red' } };
      const styles = { base: css({ background: 'blue' }) };

      const assert = (res: t.ReactCssObject) => {
        expect(res.css.styles).to.include('color:red;');
        expect(res.css.styles).to.include('background:blue;');
      };

      assert(css(styles.base, props.style));
      assert(css(styles.base, css(props.style)));
      assert(css(css(styles.base), css(css(props.style))));
      assert(css([css(styles.base), css(css(props.style))]));
      assert(
        css(
          css([css(styles.base), css(css(props.style))]),
          css([css(styles.base), [css(css([css([[props.style]])]))]]),
        ),
      );
    });

    it('cache name repeats (reused)', () => {
      const props = { style: { color: 'red' } };
      const styles = { base: css({ background: 'blue' }) };

      const a = css(css(styles.base), css(css(props.style)));
      const b = css(css(styles.base), css(css(props.style)));

      expect(a.css.name).to.equal(b.css.name); // NB: cache key (used by emotion-js).
    });

    it('wrapped ← equality', () => {
      const a = css({ color: 'red' });
      const b = css(a);
      const c = css([b]);
      const d = css([a, c], b);
      expect(b).to.eql(a);
      expect(c).to.eql(a);
      expect(d).to.eql(a);
    });
  });

  describe('Style: Is (flags)', () => {
    const NON = [123, 'hello', true, [], {}, Symbol('foo'), BigInt(0), undefined, null];

    describe('Is.serizlisedStyle (emotion)', () => {
      it('is not: serizlisedStyle', () => {
        NON.forEach((v) => expect(Is.serizlisedStyle(v)).to.eql(false));
      });

      it('is: serizlisedStyle', () => {
        const res = Emotion.css({ color: 'red' });
        expect(Is.serizlisedStyle(res)).to.eql(true);
      });
    });

    describe('Is.reactCssObject', () => {
      it('is not: reactCssObject', () => {
        NON.forEach((v) => expect(Is.reactCssObject(v)).to.eql(false));
      });

      it('is: reactCssObject', () => {
        const style = css({ color: 'red' });
        expect(Is.reactCssObject(style)).to.eql(true);
        expect(Is.reactCssObject(style.css)).to.eql(false);
      });
    });
  });
});
