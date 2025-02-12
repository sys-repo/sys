import { type t, describe, expect, it } from '../-test.ts';
import { css } from './mod.ts';

describe('Style.css (transform)', () => {
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
