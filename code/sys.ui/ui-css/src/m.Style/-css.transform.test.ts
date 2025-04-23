import { type t, DomMock, FindCss, TestPrint, c, describe, expect, it, slug } from '../-test.ts';
import { toHash } from './common.ts';
import { Style, css } from './mod.ts';

describe(
  'Style.css → transform',

  /** NB: leaked timers left around by the "happy-dom" module. */
  { sanitizeOps: false, sanitizeResources: false },

  () => {
    DomMock.polyfill();

    const setup = () => {
      const sheet = Style.Dom.stylesheet(slug());
      const css = Style.transformer({ sheet });
      return { sheet, css } as const;
    };

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

      it('pseudo‑classes on css({ input }}', () => {
        const a = css({ color: 'blue', ':hover': { color: 'red' } });
        const b = css({ color: 'blue', ':first-child': { color: 'red' } });

        // NB: this mostly forces a type check on the inputs to `css({})`.
        expect(a.style).to.eql({ color: 'blue', ':hover': { color: 'red' } });
        expect(b.style).to.eql({ color: 'blue', ':first-child': { color: 'red' } });
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
      it('scoped with root class-name', () => {
        const a = css({ Absolute: 0 });
        const b = a.container('min-width: 500px');
        expect(b.block.kind).to.eql('@container');
        expect(b.block.scoped).to.eql([`.${a.class}`]);
      });

      it('with {style} param', () => {
        const condition = 'min-width: 500px';
        const style = { Absolute: 0, fontSize: 42 };
        const base = css({ Absolute: 0 });

        const a = base.container(condition);
        const b = base.container(condition, style);
        const c = base.container('my-name', condition);
        const d = base.container('my-name', condition, style);

        [a, b, c, d].forEach((m) => {
          expect(m.block.kind).to.eql('@container');
          expect(m.block.condition).to.eql(`(${condition})`);
        });

        [a, b].forEach((m) => expect(m.block.name).to.eql(undefined));
        expect(c.block.name).to.eql('my-name');
        expect(d.block.name).to.eql('my-name');

        [a, c].forEach((m) => expect(m.block.rules.length).to.eql(0));
        [b, d].forEach((m) => {
          expect(m.block.rules.length).to.eql(1);
          expect(m.block.rules.items[0].style).to.eql({
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            fontSize: 42,
          });
        });
      });

      it('nest: multi-level descendents', () => {
        const a = css({ Absolute: 0 });
        const b = a.container('min-width: 500px');
        const c = b.nest('h2');
        const d = c.nest('code');
        [b, c, d].forEach(({ block }) => expect(block.kind).to.eql('@container'));
        expect(c.block.scoped).to.eql([`.${a.class}`, 'h2']);
        expect(d.block.scoped).to.eql([`.${a.class}`, 'h2', 'code']);
      });

      it('add custom selector: .rule()', () => {
        const container = css({ Absolute: 0 }).container('min-width: 500px');
        const rules = container.block.rules;
        expect(rules.length).to.eql(0);

        const styles = [{ color: 'red' }, { fontSize: 32 }, { color: 'blue' }];
        const a = container.rule('h2', styles[0]);
        const b = container.rule('h2', [styles[1], styles[2]]);

        expect(a[0].style).to.eql(styles[0]);
        expect(b[0].style).to.eql(styles[1]);
        expect(b[1].style).to.eql(styles[2]);

        expect(rules.length).to.eql(3);

        const root = container.block.scoped[0];
        rules.items.forEach(({ rule }) => expect(rule).to.include(`{ ${root} h2 {`));
      });

      it('add custom selector: .rule() ← CSS template', () => {
        const container = css({ Absolute: 0 }).container('min-width: 500px');
        const rules = container.block.rules;
        expect(rules.length).to.eql(0);

        const res = container.rule('h2', { Absolute: 0 });
        expect(res[0].style).to.eql({ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 });
        expect(rules.length).to.eql(1);
      });

      it('add rule: .css()', () => {
        const container = css({ Absolute: 0 }).container('min-width: 500px');
        const root = container.block.scoped[0];
        const rules = container.block.rules;
        expect(rules.length).to.eql(0);

        const a = container.css({ color: 'red' });
        expect(a).to.equal(container);
        expect(rules.length).to.eql(1);
        expect(rules.items[0].rule).to.include(`{ ${root} { color: red; } }`);

        container.css([{ PaddingX: 10 }, { color: 'blue' }]); // NB: CSS template expansion.
        expect(rules.length).to.eql(3);

        expect(rules.items[1].rule).to.include(`${root} { padding-right: 10px; padding-left: 10px`);
        expect(rules.items[2].rule).to.include(`{ ${root} { color: blue; } }`);
      });

      it('done (property): end a fluent API chain', () => {
        const base = css({ Absolute: 0 });
        const container = base.container('min-width: 500px');
        expect(container.done).to.equal(base);
        expect(container.css({ color: 'red' }).done).to.eql(base);
        expect(container.nest('h2').css({ color: 'red' }).done).to.eql(base);
      });

      it('sample: fluent chaining', () => {
        const { sheet, css } = setup();
        expect(sheet.rules.length).to.eql(0);

        const styles = {
          base: css({ containerType: 'size' }),
          h2: css({ fontSize: 50 })
            .container('min-width: 400px', { fontSize: 100 })
            .container('min-width: 700px', { PaddingX: 10 }).done,
        };

        // NB: flush rules.
        styles.base.class;
        styles.h2.class;

        const list = sheet.rules.items.map((m) => m.style);
        expect(list).to.eql([
          { fontSize: 50 },
          { fontSize: 100 },
          { paddingLeft: 10, paddingRight: 10 }, // NB: expanded CSS template (PaddingX)
          { containerType: 'size' },
        ]);
      });
    });

    describe('.rule (arbitrary sub-selectors)', () => {
      it('nests the sub-selector', () => {
        const { sheet, css } = setup();
        const base = css({ position: 'relative' });
        expect(sheet.rules.length).to.eql(0);

        const a = base.rule('h2', { color: 'red' });
        const b = base.rule('h2', { color: 'red' }); // NB: not-added (duplicate).

        expect(a).to.equal(base); // NB: enabled API chaining ("fluent").
        expect(a).to.equal(b);

        const rules = sheet.rules.items;
        expect(rules.length).to.eql(2);
        expect(rules[0].rule).to.include(`.${base.class} { position: relative; }`);
        expect(rules[1].rule).to.include(`.${base.class} h2 { color: red; }`);
      });

      it('sample: chaining', () => {
        const { sheet, css } = setup();
        const styles = {
          base: css({ position: 'relative' })
            .rule('h1', { color: 'red' })
            .rule('h2', { color: 'blue' })
            .rule('h2 code', { color: 'green' }),
        };

        const baseClass = styles.base.class;
        const rules = sheet.rules.items;

        expect(rules.length).to.eql(4);
        expect(rules[0].rule).to.include(`.${baseClass} { position: relative; }`);
        expect(rules[1].rule).to.include(`.${baseClass} h1 { color: red; }`);
        expect(rules[2].rule).to.include(`.${baseClass} h2 { color: blue; }`);
        expect(rules[3].rule).to.include(`.${baseClass} h2 code { color: green; }`);
      });

      it('empty selector', () => {
        const { sheet, css } = setup();

        const base = css({ position: 'relative' });
        expect(sheet.rules.length).to.eql(0);

        base.rule('', { color: 'red' });
        base.rule(' ', { color: 'red' }); // NB: not-added (trimmed → duplicate).
        base.rule('  ', { color: 'red' });

        const rules = sheet.rules.items;
        expect(rules.length).to.eql(2);
        expect(rules[0].rule).to.include(`.${base.class} { position: relative; }`);
        expect(rules[1].rule).to.include(`.${base.class} { color: red; }`);
      });
    });
  },
);
