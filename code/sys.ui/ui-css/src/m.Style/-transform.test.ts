import { type t, DomMock, describe, expect, findCssRule, it } from '../-test.ts';
import { toHash } from './common.ts';
import { Style, css, transform } from './mod.ts';

describe(
  'Style.css',

  /** NOTE: leaked timers left around by the "happy-dom" module. */
  { sanitizeOps: false, sanitizeResources: false },
  () => {
    DomMock.polyfill();

    it('API', () => {
      expect(Style.transform).to.equal(transform);
      expect(Style.css).to.equal(css);
    });

    describe('css → { styles }', () => {
      it('css: style ← css().style', () => {
        const style = { fontSize: 30 };
        const a = transform(style);
        const b = css(style);
        expect(b).to.eql(a.style);
      });

      it('empty', () => {
        const a = transform();
        const b = transform([]);
        const c = transform(...[], false);
        const d = transform(null, undefined, [], false, ...[]);

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
        const a = transform({ fontSize: 30 });
        const b = transform({ fontSize: 30 });
        const c = transform({ fontSize: 31 });

        expect(a.style.fontSize).to.eql(30);
        expect(b.style.fontSize).to.eql(30);
        expect(c.style.fontSize).to.eql(31);

        expect(a).to.equal(b);
        expect(a).to.not.equal(c);
      });
    });

    describe('{ Template } → {styles} | capitalised known templates.', () => {
      it('handles CSS template', () => {
        const a = transform({ Absolute: 0 });
        const b = { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 };
        expect(a.style).to.eql(b);
        expect(a.hx).to.eql(toHash(b));
        expect(a.style.Absolute).to.eql(undefined); // NB: clean up on object after transform.
      });
    });

    describe('css → "class-name" (inserted into DOM)', () => {
      it('simple', () => {
        const style = { fontSize: 30 };
        const a = transform(style);
        const className = `css-${a.hx}`;
        expect(findCssRule(className)).to.eql(undefined);

        expect(a.class).to.eql(className);
        expect(findCssRule(className)?.cssText).to.include(className);
        expect(findCssRule(className)?.cssText).to.include(a.toString());
      });
    });

    describe('toString', () => {
      it('empty', () => {
        expect(transform({}).toString()).to.eql('');
      });

      it('simple', () => {
        const a = transform({ fontSize: 30, fontFamily: 'sans-serif' });
        expect(a.toString()).to.eql('font-size: 30px; font-family: sans-serif;');
      });
    });

    describe('merging', () => {
      it('basic merge', () => {
        const a = transform({ color: 'red' });
        const b = transform({ background: 'blue' });

        const res = transform(a, b);
        expect(res.style).to.include({ color: 'red' });
        expect(res.style).to.include({ background: 'blue' });
      });

      it('deep merge', () => {
        const assert = (res: t.CssTransformed) => {
          expect(res.style).to.include({ color: 'red' });
          expect(res.style).to.include({ background: 'blue' });
        };

        const props = { style: { color: 'red' } };
        const styles = { base: transform({ background: 'blue' }) };

        assert(transform(styles.base, props.style));
        assert(transform(styles.base, transform(props.style)));
        assert(transform(transform(styles.base), transform(transform(props.style))));
        assert(transform([transform(styles.base), transform(transform(props.style))]));
        assert(
          transform(
            transform([transform(styles.base), transform(transform(props.style))]),
            transform([
              transform(styles.base),
              [transform(transform([transform([[props.style]])]))],
            ]),
          ),
        );
      });

      it('deep merge ← {style} object', () => {
        const assert = (res: t.CssProps) => {
          expect(res).to.include({ color: 'red' });
          expect(res).to.include({ background: 'blue' });
        };

        const props = { style: { color: 'red' } };
        const styles = { base: transform({ background: 'blue' }) };

        assert(css(styles.base, props.style));
        assert(css(styles.base, transform(props.style)));
        assert(css(transform(styles.base), css(transform(props.style))));
        assert(css([transform(styles.base), transform(transform(props.style))]));
        assert(
          css(
            transform([transform(styles.base), Style.transform(css(props.style))]),
            transform([
              transform(styles.base),
              [Style.css(transform([transform([[props.style]])]))],
            ]),
          ),
        );
      });

      it('cache name repeats (reused)', () => {
        const props = { style: { color: 'red' } };
        const styles = { base: transform({ background: 'blue' }) };

        const a = transform(transform(styles.base), transform(transform(props.style)));
        const b = transform(transform(styles.base), transform(transform(props.style)));
        expect(a.hx).to.equal(b.hx);
      });

      it('wrapped ← equality', () => {
        const a = transform({ color: 'red' });
        const b = transform(a);
        const c = transform([b]);
        const d = transform([a, c], b);
        expect(b).to.eql(a);
        expect(c).to.eql(a);
        expect(d).to.eql(a);
      });
    });
  },
);
