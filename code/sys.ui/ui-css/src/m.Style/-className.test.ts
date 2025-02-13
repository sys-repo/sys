import { describe, DomMock, expect, findCssRule, it, pkg, slug } from '../-test.ts';
import { DEFAULTS } from './common.ts';
import { create } from './u.className.ts';
import { transform } from './u.transform.ts';

describe(
  'Style: CSS ClassName',

  /** NOTE: leaked timers left around by the "happy-dom" module. */
  { sanitizeOps: false, sanitizeResources: false },
  () => {
    DomMock.polyfill();

    describe('create (instance)', () => {
      it('prefix: default', () => {
        const a = create('');
        const b = create('   ');
        const c = create();
        expect(a.prefix).to.eql('css');
        expect(b.prefix).to.eql('css');
        expect(c.prefix).to.eql('css');
      });

      it('custom prefix', () => {
        const test = (prefix: string, expected: string) => {
          const ns = create(prefix);
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
        const a = create();
        const b = create(DEFAULTS.prefix);
        const c = create('foo');
        expect(a).to.equal(b);
        expect(a).to.not.equal(c);
      });

      it('insert root <style> into DOM (singleton)', () => {
        const find = () => document.querySelector(`style[data-controller="${pkg.name}"]`);
        create();
        expect(find()).to.exist;
        create();
        expect(find()).to.equal(find()); // Singleton.
      });

      it('throw: invalid prefix', () => {
        const test = (prefix: string) => {
          const fn = () => create(prefix);
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
      const testSetup = () => {
        const prefix = `sample-${slug()}`;
        const manager = create(prefix);
        return { manager };
      };

      it('simple ("hx" not passed)', () => {
        const { manager } = testSetup();
        const m = transform({ fontSize: 32, display: 'grid' });
        expect(manager.classes.length).to.eql(0); // NB: no "inserted classes" yet.

        // Baseline: ensure the rule is not yet within the DOM.
        const className = `${manager.prefix}-${m.hx}`;
        expect(findCssRule(className)).to.eql(undefined); // NB: nothing inserted yet.

        const a = manager.insert(m.style);
        const b = manager.insert(m.style);

        expect(manager.classes.length).to.eql(1); // NB: not added twice.
        expect(a).to.eql(b);
        expect(a).to.eql(className);

        // Ensure is inserted within DOM.
        const rule = findCssRule(className);
        expect(rule?.cssText).to.eql(`.${className} { ${m.toString()} }`);
      });

      it('hash passed as parameter', () => {
        const { manager } = testSetup();
        const m = transform({ fontSize: 32, display: 'grid' });

        const className = `${manager.prefix}-${m.hx}`;
        expect(findCssRule(className)).to.eql(undefined); // NB: nothing inserted yet.

        manager.insert(m.style, m.hx);
        const rule = findCssRule(className);
        expect(rule?.cssText).to.eql(`.${className} { ${m.toString()} }`);
      });
    });
  },
);
