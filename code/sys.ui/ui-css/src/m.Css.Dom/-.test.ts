import { type t, describe, DomMock, expect, FindCss, it, pkg, slug } from '../-test.ts';
import { css } from '../m.Style/mod.ts';
import { DEFAULT } from './common.ts';
import { CssDom } from './mod.ts';

const toString = CssDom.toString;

describe(
  'Style: CSS ClassName',

  /** NB: leaked timers left around by the "happy-dom" module. */
  { sanitizeOps: false, sanitizeResources: false },

  () => {
    DomMock.polyfill();

    let _count = 0;
    const setup = (): t.CssDomStylesheet => {
      _count++;
      const classPrefix = `sample-${_count}`;
      return CssDom.stylesheet({ classPrefix });
    };

    describe('factory: create (instance)', () => {
      it('prefix: default class-prefix', () => {
        const a = CssDom.stylesheet({ classPrefix: '' });
        const b = CssDom.stylesheet({ classPrefix: '   ' });
        const c = CssDom.stylesheet();

      });

      it('singleton pooling (instance reuse on keyed class "prefix")', () => {
        const a = CssDom.stylesheet();
        const b = CssDom.stylesheet({ classPrefix: DEFAULT.classPrefix });
        const c = CssDom.stylesheet({ classPrefix: 'foo' });
        expect(a).to.equal(b);
        expect(a).to.not.equal(c);
      });

      it('insert root <style> into DOM (singleton)', () => {
        const find = () => document.querySelector(`style[data-controller="${pkg.name}"]`);
        CssDom.stylesheet();
        expect(find()).to.exist;
        CssDom.stylesheet();
        expect(find()).to.equal(find()); // Singleton.
      });

      it('throw: invalid prefix', () => {
        const test = (classPrefix: string) => {
          const fn = () => CssDom.stylesheet({ classPrefix });
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

    describe('.class() method: class/style DOM insertion', () => {
      it('should create <classes> API with default prefix', () => {
        const dom = setup();
        const a = dom.class();
        const b = dom.class();
        expect(a.prefix).to.eql(DEFAULT.classPrefix);
        expect(a).to.equal(b);
      });

      it('should create <classes> API with custom prefix', () => {
        const test = (prefix: string, expected: string) => {
          const dom = setup();
          const classes = dom.class(prefix);
          expect(classes.prefix).to.eql(expected);
        };
        test('foo', 'foo');
        test('  foo  ', 'foo');
        test(' foo- ', 'foo'); // NB: trimmed.
        test(' foo-- ', 'foo');
        test('foo123', 'foo123');
        test('foo-123', 'foo-123');
      });

      it('should create <classes> API with default prefix', () => {
        const dom = setup();
        const classes = dom.class();
        expect(classes.prefix).to.eql(DEFAULT.classPrefix);
      });

      it('add: simple ("hx" hash not passed)', () => {
        const dom = setup();
        const classes = dom.class();
        const m = css({ fontSize: 32, display: 'grid', PaddingX: [5, 10] });
        expect(classes.names.length).to.eql(0); // NB: no "inserted classes" yet.

        // Baseline: ensure the rule is not yet within the DOM.
        const className = `${classes.prefix}-${m.hx}`;
        expect(FindCss.rule(className)).to.eql(undefined); // NB: nothing inserted yet.

        const a = classes.add(m.style);
        const b = classes.add(m.style);

        expect(classes.names.length).to.eql(1); // NB: not added twice.
        expect(a).to.eql(b);
        expect(a).to.eql(className);

        // Ensure the CSS-rule is inserted within DOM.
        const rule = FindCss.rule(className);
        expect(rule?.cssText).to.eql(`.${className} { ${m.toString()} }`);
      });

      it('hash passed as parameter', () => {
        const dom = setup();
        const classes = dom.class();
        const { style, hx } = css({ fontSize: 32, display: 'grid' });

        const className = `${classes.prefix}-${hx}`;
        expect(FindCss.rule(className)).to.eql(undefined); // NB: nothing inserted yet.

        dom.class().add(style, { hx });
        const rule = FindCss.rule(className);
        expect(rule?.cssText).to.eql(`.${className} { ${toString(style)} }`);
      });

      describe('pseudo-class', () => {
        it(':hover', () => {
          const dom = setup();
          const classes = dom.class();
          const { style, hx } = css({ color: 'red', ':hover': { color: ' salmon ' } });
          const className = classes.add(style, { hx });
          const rules = FindCss.rules(className);
          expect(rules[0].cssText).to.eql(`.${className} { color: red; }`);
          expect(rules[1].cssText).to.eql(`.${className}:hover { color: salmon; }`);
        });
      });
    });

    describe('.rule() method: arbitrary CSS-selector DOM insertion', () => {
      it('should insert a simple rule into the stylesheet', () => {
        const dom = setup();
        const selector = '.test-rule';
        const style = { color: 'blue', margin: 10 };
        expect(FindCss.rule(selector)).to.eql(undefined);

        // Insert the rule.
        dom.rule(selector, style);

        // Verify that the rule is inserted in the DOM.
        const rule = FindCss.rule(selector);
        expect(rule).to.exist;
        expect(rule?.cssText).to.eql(`${selector} { ${toString(style)} }`);
        expect(rule?.cssText).to.eql(`.test-rule { color: blue; margin: 10px; }`); // NB: ↑ (same/same).
      });

      describe('pseudo-classes', () => {
        it('should insert pseudo-class rules along with the base rule', () => {
          const dom = setup();
          const selector = '.test-pseudo';
          const style = {
            color: 'red',
            ':hover': { color: 'green' },
          };

          // Insert the rule.
          dom.rule(selector, style);
          const rules = FindCss.rules(selector);

          // Expect one base rule and one pseudo-class rule.
          expect(rules).to.have.length(2);
          expect(rules[0].cssText).to.eql(`${selector} { ${toString({ color: 'red' })} }`);
          expect(rules[1].cssText).to.eql(`${selector}:hover { ${toString({ color: 'green' })} }`);
        });

        it('should insert multiple pseudo-class rules', () => {
          const dom = setup();
          const selector = '.test-multi';
          const style = {
            fontSize: '14px',
            ':active': { fontSize: '16px' },
            ':focus': { fontWeight: 'bold' },
          };

          // Insert the rule.
          dom.rule(selector, style);
          const rules = FindCss.rules(selector);

          // Expect 1 base rule and 2 pseudo rules.
          expect(rules).to.have.length(3);
          expect(rules[0].cssText).to.eql(`${selector} { ${toString({ fontSize: '14px' })} }`);
          expect(rules[1].cssText).to.eql(
            `${selector}:active { ${toString({ fontSize: '16px' })} }`,
          );
          expect(rules[2].cssText).to.eql(
            `${selector}:focus { ${toString({ fontWeight: 'bold' })} }`,
          );
        });

        it('should ignore pseudo-class rules if the value is not an object', () => {
          const test = (invalidValue: any) => {
            const dom = setup();
            const selector = `.test-invalid-value-${slug()}`;
            const style = {
              color: 'blue',
              ':hover': invalidValue, // invalid; value must be a {record/object}.
            };

            dom.rule(selector, style);
            const rules = FindCss.rules(selector);

            // Only the base rule should be inserted.
            expect(rules).to.have.length(1);
            expect(rules[0].cssText).to.eql(`${selector} { ${toString({ color: 'blue' })} }`);
          };

          const NON = ['not-an-object', 123, true, null, undefined, BigInt(0), Symbol('foo'), []];
          NON.forEach(test);
        });

        it('should ignore keys that are not valid pseudo-classes', () => {
          const dom = setup();
          const selector = '.test-non-pseudo';
          const style = {
            color: 'blue',
            ':nonexistent': { color: 'red' }, // not in our DEFAULT pseudo-class set.
          };

          dom.rule(selector, style);
          const rules = FindCss.rules(selector);

          // Only the base rule should be inserted.
          expect(rules).to.have.length(1);
          expect(rules[0].cssText).to.eql(`${selector} { ${toString({ color: 'blue' })} }`);
        });

        it('should insert an empty pseu0o-class rule when given an empty style object', () => {
          const dom = setup();
          const selector = '.test-empty-pseudo';
          const style = {
            color: 'blue',
            ':hover': {}, // empty nested style.
          };

          dom.rule(selector, style);
          const rules = FindCss.rules(selector);

          // Expect a base rule and a pseudo-class rule, even if the nested style is empty.
          expect(rules).to.have.length(2);
          expect(rules[0].cssText).to.eql(`${selector} { ${toString({ color: 'blue' })} }`);
          expect(rules[1].cssText).to.eql(`${selector}:hover { ${toString({})} }`);
        });

        it('should prevent duplicate pseudo-class rules when the same style is inserted twice', () => {
          const dom = setup();
          const selector = '.test-duplicate-pseudo';
          const style = {
            color: 'blue',
            ':hover': { color: 'red' },
          };

          // Call rule() twice with the same selector and style.
          dom.rule(selector, style);
          dom.rule(selector, style);
          const rules = FindCss.rules(selector);

          // If duplicate prevention is implemented, there should be only one base rule and one pseudo-class rule.
          expect(rules).to.have.length(2);
          expect(rules[0].cssText).to.eql(`${selector} { ${toString({ color: 'blue' })} }`);
          expect(rules[1].cssText).to.eql(`${selector}:hover { ${toString({ color: 'red' })} }`);
        });
      });
    });
  },
);
