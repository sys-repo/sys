import { type t, describe, DomMock, expect, FindCss, it, pkg, slug } from '../-test.ts';
import { css } from '../m.Style/mod.ts';
import { DEFAULT } from './common.ts';
import { CssDom } from './mod.ts';
import { getStylesheetId } from './u.ts';

const toString = CssDom.toString;

describe(
  'Style: CSS ClassName',
  { sanitizeOps: false, sanitizeResources: false }, // ← because: "Happy-Dom"
  () => {
    DomMock.polyfill();

    let _count = 0;
    const setup = () => {
      _count++;
      const sheet = CssDom.stylesheet({ instance: `mysheet-${_count}` });
      const classes = sheet.classes(`foo-${_count}`);
      return { sheet, classes } as const;
    };

    describe('factory: create <Stylesheet> instance', () => {
      it('instance id: default and custom', () => {
        const a = CssDom.stylesheet({});
        const b = CssDom.stylesheet({ instance: '  foo  ' });
        expect(a.id).to.eql(pkg.name);
        expect(a.rules.list).to.eql([]);
        expect(b.id).to.eql(`${pkg.name}:foo`);
      });

      it('instance id (as string param)', () => {
        const id = slug();
        const sheet = CssDom.stylesheet(id);
        expect(sheet.id).to.eql(`${pkg.name}:${id}`);
      });

      it('singleton pooling (instance reuse on data-id)', () => {
        const a = CssDom.stylesheet();
        const b = CssDom.stylesheet({ instance: '  ' });
        const c = CssDom.stylesheet({ instance: 'bar' });
        expect(a).to.equal(b);
        expect(a).to.not.equal(c);
      });

      it('insert root <style> into DOM (singleton)', () => {
        const test = (instance?: t.StringId, classPrefix?: string) => {
          const id = getStylesheetId(instance, classPrefix);

          const find = () => document.querySelector(`style[data-controller="${id}"]`);
          CssDom.stylesheet({ instance, classPrefix });

          expect(find()).to.exist;
          CssDom.stylesheet({ instance, classPrefix });
          expect(find()).to.equal(find()); // NB: Singleton.
        };

        test();
        test('foobar');
        test('foobar', 'my-class-prefix');
      });
    });

    describe('.classes(): prefixed class/style DOM insertion', () => {
      it('should create <classes> API with default prefix', () => {
        const dom = CssDom.stylesheet();
        const a = dom.classes();
        const b = dom.classes();
        expect(a.prefix).to.eql(DEFAULT.classPrefix);
        expect(a).to.equal(b);
      });

      it('should create <classes> API with custom prefix', () => {
        const test = (prefix: string, expected: string) => {
          const sample = setup();
          const classes = sample.sheet.classes(prefix);
          expect(classes.prefix).to.eql(expected);
        };
        test('foo', 'foo');
        test('.foo', 'foo');
        test('  foo  ', 'foo');
        test(' foo- ', 'foo'); // NB: trimmed.
        test(' foo-- ', 'foo');
        test('foo123', 'foo123');
        test('foo-123', 'foo-123');
      });

      it('should pass default "classPrefix" value to .classes() API', () => {
        const a = CssDom.stylesheet({ instance: slug() });
        const b = CssDom.stylesheet({ instance: slug(), classPrefix: 'foo' });
        const styleA = a.classes().add({ fontSize: 16 });
        const styleB = b.classes().add({ fontSize: 16 });
        expect(styleA.startsWith('sys-')).to.eql(true);
        expect(styleB.startsWith('foo-')).to.eql(true);
      });

      it('throw: invalid prefix', () => {
        const { sheet } = setup();
        const test = (prefix: string) => {
          const fn = () => sheet.classes(prefix);
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

      it('add: simple ("hx" hash not passed)', () => {
        const { sheet } = setup();
        const classes = sheet.classes();
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

      it('add: hash passed as parameter', () => {
        const { sheet } = setup();
        const classes = sheet.classes();
        const { style, hx } = css({ fontSize: 32, display: 'grid' });

        const className = `${classes.prefix}-${hx}`;
        expect(FindCss.rule(className)).to.eql(undefined); // NB: nothing inserted yet.

        sheet.classes().add(style, { hx });
        const rule = FindCss.rule(className);
        expect(rule?.cssText).to.eql(`.${className} { ${toString(style)} }`);
      });

      describe('pseudo-classes', () => {
        it(':hover', () => {
          const { sheet } = setup();
          const classes = sheet.classes();
          const { style, hx } = css({ color: 'red', ':hover': { color: ' salmon ' } });
          const className = classes.add(style, { hx });
          const rules = FindCss.rules(className);
          expect(rules[0].cssText).to.eql(`.${className} { color: red; }`);
          expect(rules[1].cssText).to.eql(`.${className}:hover { color: salmon; }`);
        });
      });
    });

    describe('.rule(): arbitrary CSS-selector DOM insertion', () => {
      it('should insert a simple rule into the stylesheet', () => {
        const { sheet } = setup();
        const selector = '.test-rule';
        const style = { color: 'blue', margin: 10 };

        // Pre-condition.
        expect(FindCss.rule(selector)).to.eql(undefined);
        expect(sheet.rules.list).to.eql([]);
        expect(sheet.rules.length).to.eql(0);

        // Insert the rule.
        const res = sheet.rule(selector, style);
        expect(res.length).to.eql(1);
        expect(res[0].selector).to.eql(selector);
        expect(res[0].style).to.eql(style);

        expect(sheet.rules.length).to.eql(1);
        expect(sheet.rules.list.length).to.eql(1);
        expect(sheet.rules.list).to.eql(res);

        // Verify that the rule is inserted in the DOM.
        const rule = FindCss.rule(selector);
        expect(rule).to.exist;
        expect(rule?.cssText).to.eql(`${selector} { ${toString(style)} }`);
        expect(rule?.cssText).to.eql(`.test-rule { color: blue; margin: 10px; }`); // NB: ↑ (same/same).
      });

      it('should not insert the same rule twice', () => {
        const { sheet } = setup();
        const selector = '.test-rule';
        const style = { margin: 10 };

        const insert = () => sheet.rule(selector, style);
        const res = insert();

        expect(res.length).to.eql(1);
        expect(res[0].selector).to.eql(selector);
        expect(res[0].style).to.eql(style);

        // NB: further calls do not add more items.
        expect(insert()).to.eql([]);
        expect(insert()).to.eql([]);
        expect(sheet.rules.list.length).to.eql(1);
      });

      describe('rules within context-blocks', () => {
        it('should insert a simple rule within an "@container" context', () => {
          const { sheet } = setup();
          const selector = `.test-container-${slug()}`;
          const style = { color: 'blue', margin: 10 };
          const context = '@container (min-width: 700px)';
          expect(FindCss.rule(selector)).to.eql(undefined);

          // Insert the rule within an "@container" context.
          const res = sheet.rule(selector, style, { context });
          expect(res.length).to.eql(1);
          expect(res[0].selector).to.eql(selector);
          expect(res[0].style).to.eql(style);

          // Verify that the rule is inserted in the DOM, wrapped in the context block.
          const rule = FindCss.rule(selector);
          expect(rule).to.exist;
          const expectedCssText = `${context} { ${selector} { ${toString(style)} } }`;
          expect(rule?.cssText).to.eql(expectedCssText);
        });

        it('should insert multiple rules within an "@container" context', () => {
          const { sheet } = setup();
          const selector = `.test-container-${slug()}`;
          const context = '@container (min-width: 700px)';
          const styles = [
            { color: 'blue', margin: 10 },
            { backgroundColor: 'yellow', padding: 5 },
          ];

          // Pre-check: Ensure no rule exists for the selector.
          expect(FindCss.rules(selector)).to.eql([]);

          // Insert the rules with an "@container" context.
          const res = sheet.rule(selector, styles, { context });
          expect(res.length).to.eql(2);
          expect(res[0].style).to.eql(styles[0]);
          expect(res[1].style).to.eql(styles[1]);

          // Retrieve all inserted rules for the selector.
          const rules = FindCss.rules(selector);
          expect(rules).to.have.length(2);

          // Verify that each rule is inserted in the DOM, wrapped in the context block.
          const expected1 = `${context} { ${selector} { ${toString(styles[0])} } }`;
          const expected2 = `${context} { ${selector} { ${toString(styles[1])} } }`;
          expect(rules[0].cssText).to.eql(expected1);
          expect(rules[1].cssText).to.eql(expected2);
        });
      });

      describe('pseudo-classes', () => {
        it('should insert pseudo-class rules along with the base rule', () => {
          const { sheet } = setup();
          const selector = '.test-pseudo';
          const style = {
            color: 'red',
            ':hover': { color: 'green' },
          };

          // Insert the rule.
          sheet.rule(selector, style);
          const rules = FindCss.rules(selector);

          // Expect one base rule and one pseudo-class rule.
          expect(rules).to.have.length(2);
          expect(rules[0].cssText).to.eql(`${selector} { ${toString({ color: 'red' })} }`);
          expect(rules[1].cssText).to.eql(`${selector}:hover { ${toString({ color: 'green' })} }`);
        });

        it('should insert multiple pseudo-class rules', () => {
          const { sheet } = setup();
          const selector = '.test-multi';
          const style = {
            fontSize: '14px',
            ':active': { fontSize: '16px' },
            ':focus': { fontWeight: 'bold' },
          };

          // Insert the rule.
          sheet.rule(selector, style);
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
            const { sheet } = setup();
            const selector = `.test-invalid-value-${slug()}`;
            const style = {
              color: 'blue',
              ':hover': invalidValue, // invalid; value must be a {record/object}.
            };

            sheet.rule(selector, style);
            const rules = FindCss.rules(selector);

            // Only the base rule should be inserted.
            expect(rules).to.have.length(1);
            expect(rules[0].cssText).to.eql(`${selector} { ${toString({ color: 'blue' })} }`);
          };

          const NON = ['not-an-object', 123, true, null, undefined, BigInt(0), Symbol('foo'), []];
          NON.forEach(test);
        });

        it('should ignore keys that are not valid pseudo-classes', () => {
          const { sheet } = setup();
          const selector = '.test-non-pseudo';
          const style = {
            color: 'blue',
            ':nonexistent': { color: 'red' }, // not in our DEFAULT pseudo-class set.
          };

          sheet.rule(selector, style);
          const rules = FindCss.rules(selector);

          // Only the base rule should be inserted.
          expect(rules).to.have.length(1);
          expect(rules[0].cssText).to.eql(`${selector} { ${toString({ color: 'blue' })} }`);
        });

        it('should insert an empty pseu0o-class rule when given an empty style object', () => {
          const { sheet } = setup();
          const selector = '.test-empty-pseudo';
          const style = {
            color: 'blue',
            ':hover': {}, // empty nested style.
          };

          sheet.rule(selector, style);
          const rules = FindCss.rules(selector);

          // Expect a base rule and a pseudo-class rule, even if the nested style is empty.
          expect(rules).to.have.length(2);
          expect(rules[0].cssText).to.eql(`${selector} { ${toString({ color: 'blue' })} }`);
          expect(rules[1].cssText).to.eql(`${selector}:hover { ${toString({})} }`);
        });

        it('should prevent duplicate pseudo-class rules when the same style is inserted twice', () => {
          const { sheet } = setup();
          const selector = '.test-duplicate-pseudo';
          const style = {
            color: 'blue',
            ':hover': { color: 'red' },
          };

          // Call rule() twice with the same selector and style.
          sheet.rule(selector, style);
          sheet.rule(selector, style);
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
