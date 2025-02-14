import { type t, DomMock, c, describe, expect, findCssRule, it, TestPrint } from '../-test.ts';
import { toHash } from './common.ts';
import { Style, css } from './mod.ts';

describe('Style.css', () => {
  DomMock.polyfill();

  it('API', () => {
    expect(Style.css).to.equal(css);
  });

  describe('css → { styles }', () => {
    it('empty', () => {
      const a = css();
      const b = css([]);
      const c = css(...[], false);
      const d = css(null, undefined, [], false, ...[]);

      expect(a.style).to.eql({});
      expect(b).to.eql(a);
      expect(c).to.eql(a);
      expect(d).to.eql(a);

      // Cached instances (on hx).
      expect(a.style).to.equal(b.style);
      expect(a.style).to.equal(c.style);
      expect(a.style).to.equal(d.style);
    });

    it('plain CSS fields', () => {
      const a = css({ fontSize: 30 });
      const b = css({ fontSize: 30 });
      const c = css({ fontSize: 31 });

      expect(a.style.fontSize).to.eql(30);
      expect(b.style.fontSize).to.eql(30);
      expect(c.style.fontSize).to.eql(31);

      expect(a).to.equal(b);
      expect(a).to.not.equal(c);
    });
  });

  describe('{ Template } → {styles} | capitalised known templates.', () => {
    it('Absolute: 0', () => {
      const a = css({ Absolute: 0 });
      const b = { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 };
      expect(a.style).to.eql(b);
      expect(a.hx).to.eql(toHash(b));
      expect(a.style.Absolute).to.eql(undefined); // NB: clean up on object after transform.
    });

    it('PaddingX: [10, 20]', () => {
      const a = css({ PaddingX: [10, 20] });
      const b = { paddingLeft: 10, paddingRight: 20 };
      expect(a.style).to.eql(b);
      expect(a.hx).to.eql(toHash(b));
      expect(a.style.PaddingX).to.eql(undefined); // NB: clean up on object after transform.
    });
  });

  describe('css → "class-name" (inserted into DOM)', () => {
    it('simple', () => {
      const prefix = 'foo';
      const css = Style.transformer({ prefix });

      const input: t.CssProps = { PaddingX: [10, 30] };
      const m = css({ PaddingX: [10, 30] });
      const className = `${prefix}-${m.hx}`;
      expect(findCssRule(className)).to.eql(undefined);

      console.info(c.gray('\nInput:'), input);
      console.info(c.gray('↓'));
      TestPrint.transformed(m);

      expect(m.class).to.eql(className); // NB: insertion into DOM happens here.
      expect(findCssRule(className)?.cssText).to.include(className);
      expect(findCssRule(className)?.cssText).to.include(m.toString());
    });
  });

  describe('toString', () => {
    it('empty', () => {
      expect(css({}).toString()).to.eql('');
    });

    it('simple', () => {
      const a = css({ fontSize: 30, fontFamily: 'sans-serif' });
      expect(a.toString()).to.eql('font-size: 30px; font-family: sans-serif;');
    });
  });

  describe('merging', () => {
    it('basic merge', () => {
      const a = css({ color: 'red' });
      const b = css({ background: 'blue' });

      const res = css(a, b);
      expect(res.style).to.include({ color: 'red' });
      expect(res.style).to.include({ background: 'blue' });
    });

    it('deep merge', () => {
      const assert = (res: t.CssTransformed) => {
        expect(res.style).to.include({ color: 'red' });
        expect(res.style).to.include({ background: 'blue' });
      };

      const props = { style: { color: 'red' } };
      const styles = { base: css({ background: 'blue' }) };

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

    it('deep merge ← {style} object', () => {
      const assert = (res: t.CssTransformed) => {
        expect(res.style).to.include({ color: 'red' });
        expect(res.style).to.include({ background: 'blue' });
      };

      const props = { style: { color: 'red' } };
      const styles = { base: css({ background: 'blue' }) };

      assert(css(styles.base, props.style));
      assert(css(styles.base, css(props.style)));
      assert(css(css(styles.base), css(css(props.style))));
      assert(css([css(styles.base), css(css(props.style))]));
      assert(
        css(
          css([css(styles.base), Style.css(css(props.style))]),
          css([css(styles.base), [Style.css(css([css([[props.style]])]))]]),
        ),
      );
    });

    it('cache name repeats (reused)', () => {
      const props = { style: { color: 'red' } };
      const styles = { base: css({ background: 'blue' }) };

      const a = css(css(styles.base), css(css(props.style)));
      const b = css(css(styles.base), css(css(props.style)));
      expect(a.hx).to.equal(b.hx);
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
});
