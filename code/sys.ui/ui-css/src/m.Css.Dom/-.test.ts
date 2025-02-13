import { type t, describe, DomMock, expect, findCssRule, it, pkg, slug } from '../-test.ts';
import { transform } from '../m.Style/mod.ts';
import { DEFAULTS } from './common.ts';
import { CssDom } from './mod.ts';

describe(
  'Style: CSS ClassName',

  /** NOTE: leaked timers left around by the "happy-dom" module. */
  { sanitizeOps: false, sanitizeResources: false },
  () => {
    DomMock.polyfill();

    describe('create (instance)', () => {
      it('prefix: default', () => {
        const a = CssDom.create('');
        const b = CssDom.create('   ');
        const c = CssDom.create();
        expect(a.prefix).to.eql('css');
        expect(b.prefix).to.eql('css');
        expect(c.prefix).to.eql('css');
      });

      it('custom prefix', () => {
        const test = (prefix: string, expected: string) => {
          const ns = CssDom.create(prefix);
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
        const a = CssDom.create();
        const b = CssDom.create(DEFAULTS.prefix);
        const c = CssDom.create('foo');
        expect(a).to.equal(b);
        expect(a).to.not.equal(c);
      });

      it('insert root <style> into DOM (singleton)', () => {
        const find = () => document.querySelector(`style[data-controller="${pkg.name}"]`);
        CssDom.create();
        expect(find()).to.exist;
        CssDom.create();
        expect(find()).to.equal(find()); // Singleton.
      });

      it('throw: invalid prefix', () => {
        const test = (prefix: string) => {
          const fn = () => CssDom.create(prefix);
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
      const setup = (): t.CssDom => {
        const prefix = `sample-${slug()}`;
        return CssDom.create(prefix);
      };

      it('simple ("hx" not passed)', () => {
        const dom = setup();
        const m = transform({ fontSize: 32, display: 'grid', PaddingX: [5, 10] });
        expect(dom.classes.length).to.eql(0); // NB: no "inserted classes" yet.

        // Baseline: ensure the rule is not yet within the DOM.
        const className = `${dom.prefix}-${m.hx}`;
        expect(findCssRule(className)).to.eql(undefined); // NB: nothing inserted yet.

        const a = dom.class(m.style);
        const b = dom.class(m.style);

        expect(dom.classes.length).to.eql(1); // NB: not added twice.
        expect(a).to.eql(b);
        expect(a).to.eql(className);

        // Ensure is inserted within DOM.
        const rule = findCssRule(className);
        expect(rule?.cssText).to.eql(`.${className} { ${m.toString()} }`);
      });

      it('hash passed as parameter', () => {
        const dom = setup();
        const m = transform({ fontSize: 32, display: 'grid' });

        const className = `${dom.prefix}-${m.hx}`;
        expect(findCssRule(className)).to.eql(undefined); // NB: nothing inserted yet.

        dom.class(m.style, m.hx);
        const rule = findCssRule(className);
        expect(rule?.cssText).to.eql(`.${className} { ${m.toString()} }`);
      });
    });
  },
);
