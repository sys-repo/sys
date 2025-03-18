import { type t, describe, DomMock, expect, FindCss, it, pkg } from '../-test.ts';
import { css } from '../m.Style/mod.ts';
import { DEFAULT } from './common.ts';
import { CssDom } from './mod.ts';

describe(
  'Style: CSS ClassName',

  /** NB: leaked timers left around by the "happy-dom" module. */
  { sanitizeOps: false, sanitizeResources: false },

  () => {
    DomMock.polyfill();

    describe('create (instance)', () => {
      it('prefix: default', () => {
        const a = CssDom.createStylesheet('');
        const b = CssDom.createStylesheet('   ');
        const c = CssDom.createStylesheet();
        expect(a.prefix).to.eql(DEFAULT.prefix);
        expect(b.prefix).to.eql(DEFAULT.prefix);
        expect(c.prefix).to.eql(DEFAULT.prefix);
      });

      it('custom prefix', () => {
        const test = (prefix: string, expected: string) => {
          const ns = CssDom.createStylesheet(prefix);
          expect(ns.prefix).to.eql(expected);
        };
        test('foo', 'foo');
        test('  foo  ', 'foo');
        test(' foo- ', 'foo'); // NB: trimmed.
        test(' foo-- ', 'foo');
        test('foo123', 'foo123');
        test('foo-123', 'foo-123');
      });

      it('pooling (instance reuse keyed on "prefix")', () => {
        const a = CssDom.createStylesheet();
        const b = CssDom.createStylesheet(DEFAULT.prefix);
        const c = CssDom.createStylesheet('foo');
        expect(a).to.equal(b);
        expect(a).to.not.equal(c);
      });

      it('insert root <style> into DOM (singleton)', () => {
        const find = () => document.querySelector(`style[data-controller="${pkg.name}"]`);
        CssDom.createStylesheet();
        expect(find()).to.exist;
        CssDom.createStylesheet();
        expect(find()).to.equal(find()); // Singleton.
      });

      it('throw: invalid prefix', () => {
        const test = (prefix: string) => {
          const fn = () => CssDom.createStylesheet(prefix);
          expect(fn).to.throw(
            /String must start with a letter and can contain letters, digits, and hyphens \(hyphen not allowed at the beginning\)/,
          );
        };
        test('123foo'); // NB: Starts with a number.
        test(' 123-foo ');
        test('-foo');
        test('-');
        test('foo*bar');
      });
    });

    describe('class/style DOM insertion', () => {
      let count = 0;
      const setup = (): t.CssDom => {
        count++;
        const prefix = `sample${count}`;
        return CssDom.createStylesheet(prefix);
      };

      it('simple ("hx" not passed)', () => {
        const dom = setup();
        const m = css({ fontSize: 32, display: 'grid', PaddingX: [5, 10] });
        expect(dom.classes.length).to.eql(0); // NB: no "inserted classes" yet.

        // Baseline: ensure the rule is not yet within the DOM.
        const className = `${dom.prefix}-${m.hx}`;
        expect(FindCss.rule(className)).to.eql(undefined); // NB: nothing inserted yet.

        const a = dom.class(m.style);
        const b = dom.class(m.style);

        expect(dom.classes.length).to.eql(1); // NB: not added twice.
        expect(a).to.eql(b);
        expect(a).to.eql(className);

        // Ensure the CSS-rule is inserted within DOM.
        const rule = FindCss.rule(className);
        expect(rule?.cssText).to.eql(`.${className} { ${m.toString()} }`);
      });

      it('hash passed as parameter', () => {
        const dom = setup();
        const m = css({ fontSize: 32, display: 'grid' });

        const className = `${dom.prefix}-${m.hx}`;
        expect(FindCss.rule(className)).to.eql(undefined); // NB: nothing inserted yet.

        dom.class(m.style, m.hx);
        const rule = FindCss.rule(className);
        expect(rule?.cssText).to.eql(`.${className} { ${m.toString()} }`);
      });

      describe('pseudo-class', () => {
        it(':hover', () => {
          const dom = setup();
          const m = css({ color: 'red', ':hover': { color: ' salmon ' } });
          const className = dom.class(m.style, m.hx);
          const rules = FindCss.rules(className);
          expect(rules[0].cssText).to.eql(`.${className} { color: red; }`);
          expect(rules[1].cssText).to.eql(`.${className}:hover { color: salmon; }`);
        });
      });
    });
  },
);
