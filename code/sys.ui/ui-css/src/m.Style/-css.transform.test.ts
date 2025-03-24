import { type t, DomMock, FindCss, TestPrint, c, describe, expect, it, slug } from '../-test.ts';
import { toHash } from './common.ts';
import { Style, css } from './mod.ts';

describe(
  'Style.css → transform',

  /** NB: leaked timers left around by the "happy-dom" module. */
  { sanitizeOps: false, sanitizeResources: false },

  () => {
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

    describe('{ Template } → {styles} | known templates starting with a capital-letter', () => {
      it('Absolute: 0', () => {
        const a = css({ Absolute: 0 });
        const b = { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 };
        expect(a.style).to.eql(b);
        expect(a.hx).to.eql(toHash(b));
        expect((a.style as any).Absolute).to.eql(undefined); // NB: clean up on object after transform.
      });

      it('PaddingX: [10, 20]', () => {
        const a = css({ PaddingX: [10, 20] });
        const b = { paddingLeft: 10, paddingRight: 20 };
        expect(a.style).to.eql(b);
        expect(a.hx).to.eql(toHash(b));
        expect((a.style as any).PaddingX).to.eql(undefined); // NB: clean up on object after transform.
      });
    });

    describe('css → "class-name" (inserted into DOM)', () => {
      it('simple', () => {
        const sheet = Style.Dom.stylesheet({ classPrefix: 'foo' });
        const css = Style.transformer({ sheet });

        const input: t.CssValue = { PaddingX: [10, 30] };
        const m = css({ PaddingX: [10, 30] });
        const className = `foo-${m.hx}`;
        expect(FindCss.rule(className)).to.eql(undefined);

        console.info(c.gray('\nInput:'), input);
        console.info(c.gray('↓'));
        TestPrint.transformed(m);

        expect(m.class).to.eql(className); // NB: insertion into DOM happens here.
        expect(FindCss.rule(className)?.cssText).to.include(className);
        expect(FindCss.rule(className)?.cssText).to.include(m.toString());
      });
    });

    describe('toString', () => {
      const style = { fontSize: 30, fontFamily: 'sans-serif' };

      const print = (kind: t.CssTransformToStringKind, value: string) => {
        console.info();
        console.info(`${c.brightCyan(kind)}: "${c.yellow(value)}"`);
        console.info();
      };

      it('empty', () => {
        expect(css({}).toString()).to.eql('');
      });

      it('kind: CssRule (default)', () => {
        const m = css(style);
        const a = m.toString();
        const b = m.toString('CssRule');

        print('CssRule', m.toString());

        expect(a).to.eql('font-size: 30px; font-family: sans-serif;');
        expect(a).to.eql(b);
      });

      it('kind: CssSelector', () => {
        const sheet = Style.Dom.stylesheet({ classPrefix: 'foo' });
        const css = Style.transformer({ sheet });
        const m = css(style);
        const str = m.toString('CssSelector');

        print('CssSelector', str);
        expect(str).to.eql(`.foo-${m.hx} { font-size: 30px; font-family: sans-serif; }`);
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

    describe('.container', () => {
      it('scoped', () => {
        const a = css({ Absolute: 0 });
        const b = a.container('min-width: 500px');
        expect(b.kind).to.eql('@container');
        expect(b.scoped).to.eql([`.${a.class}`]);
      });

      it('scope: with {style} param', () => {
        const condition = 'min-width: 500px';
        const style = { fontSize: 42 };
        const base = css({ Absolute: 0 });

        const a = base.container(condition);
        const b = base.container(condition, style);
        const c = base.container('my-name', condition);
        const d = base.container('my-name', condition, style);

        [a, b, c, d].forEach((m) => {
          expect(m.kind).to.eql('@container');
          expect(m.condition).to.eql(`(${condition})`);
        });

        [a, b].forEach((m) => expect(m.name).to.eql(undefined));
        expect(c.name).to.eql('my-name');
        expect(d.name).to.eql('my-name');

        [a, c].forEach((m) => expect(m.rules.length).to.eql(0));
        [b, d].forEach((m) => {
          expect(m.rules.length).to.eql(1);
          expect(m.rules.list[0].style).to.eql(style);
        });
      });

      it('multi-level', () => {
        const a = css({ Absolute: 0 });
        const b = a.container('min-width: 500px');
        const c = b.scope('h2');
        expect(c.kind).to.eql('@container');
        expect(c.scoped).to.eql([`.${a.class}`, `h2`]);
      });
    });
  },
);
