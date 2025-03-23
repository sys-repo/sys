import { describe, expect, FindCss, it, slug, TestPrint, DomMock } from '../-test.ts';
import { CssDom } from './mod.ts';

const toString = CssDom.toString;

describe(
  'Stylesheet.container(): scoped @container context',
  { sanitizeOps: false, sanitizeResources: false }, // ← because: "Happy-Dom"
  () => {
    DomMock.polyfill();

    let _count = 0;
    const setup = () => {
      _count++;
      const sheet = CssDom.stylesheet({ instance: `mysheet-${_count}` });
      return { sheet } as const;
    };

    it('create: → kind', () => {
      const { sheet } = setup();
      const container = sheet.container('min-width: 700px');
      expect(container.kind).to.eql('@container');
      expect(container.condition).to.eql('(min-width: 700px)');
    });

    it("create: cleans up the context's <condition> input", () => {
      const { sheet } = setup();
      const test = (condition: string, expected?: string) => {
        const container = sheet.container(condition);
        expect(container.condition).to.eql(expected ?? condition.trim());
      };
      test('  min-width: 700px  ', '(min-width: 700px)'); // NB: parentheses added.
      test(' (max-width: 1200px) and (orientation: landscape)');
    });

    it('toString', () => {
      const { sheet } = setup();
      const container = sheet.container('  min-width: 700px  ');
      expect(container.toString()).to.eql('@container (min-width: 700px)');
    });

    it('adds to stylesheet', () => {
      const { sheet } = setup();

      const selector = `.test-container-${slug()}`;
      const context = '@container (min-width: 700px)';
      const styles = [
        { color: 'blue', margin: 10 },
        { backgroundColor: 'yellow', padding: 5 },
      ];

      // Pre-check: Ensure no rule exists for the selector.
      expect(FindCss.rules(selector)).to.eql([]);

      const container = sheet.container('min-width: 700px');
      container.rule(selector, styles);

      // Retrieve all inserted rules for the selector.
      const rules = FindCss.rules(selector);
      expect(rules).to.have.length(2);

      // Verify that each rule is inserted in the DOM, wrapped in the context block.
      const expected1 = `${context} { ${selector} { ${toString(styles[0])} } }`;
      const expected2 = `${context} { ${selector} { ${toString(styles[1])} } }`;
      expect(rules[0].cssText).to.eql(expected1);
      expect(rules[1].cssText).to.eql(expected2);
    });
  },
);
