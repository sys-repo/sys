import { describe, DomMock, expect, FindCss, it, slug, TestPrint } from '../-test.ts';
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

    describe('create', () => {
      it('create', () => {
        const { sheet } = setup();
        const container = sheet.container('  min-width: 700px  ');
        TestPrint.container(container);
        expect(container.kind).to.eql('@container');
        expect(container.condition).to.eql('(min-width: 700px)');
        expect(container.name).to.eql(undefined);
        expect(container.rules.length).to.eql(0);
        expect(container.rules.items).to.eql([]);
        expect(container.scoped).to.eql([]);
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

      it('create with name', () => {
        const { sheet } = setup();
        const container = sheet.container('  card  ', '  min-width: 700px  ');
        TestPrint.container(container);
        expect(container.kind).to.eql('@container');
        expect(container.name).to.eql('card');
        expect(container.condition).to.eql('(min-width: 700px)');
      });
    });

    describe('toString', () => {
      it('(default) → kind: "QueryCondition"', () => {
        const { sheet } = setup();
        const a = sheet.container('min-width: 700px');
        const b = sheet.container('  min-width: 700px  ');
        const c = sheet.container('  my-name  ', '  min-width: 700px  ');
        expect(a.toString()).to.eql('@container (min-width: 700px)');
        expect(b.toString()).to.eql(a.toString());
        expect(c.toString()).to.eql('@container my-name (min-width: 700px)');
        expect(b.toString()).to.eql(b.toString('QueryCondition')); // NB: default kind.
      });

      it('kind: "CssSelector"', () => {
        const { sheet } = setup();
        const container = sheet.container('my-name', 'min-width: 700px');

        const a = container.toString();
        const b = container.toString('CssSelector');

        container.rules.add('.foo', { fontSize: 16 });
        const c = container.toString('CssSelector');
        container.rules.add('.bar', { color: 'red' });
        const d = container.toString('CssSelector');

        expect(a).to.eql('@container my-name (min-width: 700px)');
        expect(b).to.eql('@container my-name (min-width: 700px) {}');
        expect(c).to.eql('@container my-name (min-width: 700px) { .foo { font-size: 16px; } }');
        expect(d.split('\n')[0]).to.eql(
          '@container my-name (min-width: 700px) { .foo { font-size: 16px; } }',
        );
        expect(d.split('\n')[1]).to.eql(
          '@container my-name (min-width: 700px) { .bar { color: red; } }',
        );

        TestPrint.container(container);
      });
    });

    describe('adding rules', () => {
      it('adds each rule only once', () => {
        const { sheet } = setup();
        const styles = [
          { color: 'blue', margin: 10 },
          { backgroundColor: 'yellow', padding: 5 },
        ];

        const container = sheet.container('min-width: 700px');
        expect(container.rules.items).to.eql([]);
        expect(container.rules.length).to.eql(0);

        const selector = `.test-${slug()}`;
        const res1 = container.rules.add(selector, styles);
        expect(res1.length).to.eql(2);
        expect(container.rules.length).to.eql(2);

        // Additional calls with the same style content is not inserted.
        expect(container.rules.add(selector, styles)).to.eql([]); // NB: second time - not repeated
        expect(container.rules.add(selector, styles[0])).to.eql([]);
        expect(container.rules.add(selector, styles[1])).to.eql([]);
        expect(container.rules.add(selector, [])).to.eql([]);

        expect(container.rules.items.length).to.eql(2);
        expect(container.rules.items[0].selector).to.eql(selector);
        expect(container.rules.items[0].style).to.eql(styles[0]);
        expect(container.rules.items[1].selector).to.eql(selector);
        expect(container.rules.items[1].style).to.eql(styles[1]);
      });

      it('add: CSS template ← { Absolute: 0 }', () => {
        const { sheet } = setup();
        const container = sheet.container('min-width: 700px');
        expect(container.rules.items).to.eql([]);

        const selector = `.test-${slug()}`;
        const res = container.rules.add(selector, { Absolute: 0 });
        expect(res[0].style).to.eql({ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 });
      });

      it('adds to DOM stylesheet', () => {
        const { sheet } = setup();
        const selector = `.test-${slug()}`;
        const context = '@container (min-width: 700px)';
        const styles = [
          { color: 'blue', margin: 10 },
          { backgroundColor: 'yellow', padding: 5 },
        ];

        // Pre-check: Ensure no rule exists for the selector.
        expect(FindCss.rules(selector)).to.eql([]);

        const container = sheet.container('min-width: 700px');
        container.rules.add(selector, styles);

        // Retrieve all inserted rules for the selector.
        const rules = FindCss.rules(selector);
        expect(rules).to.have.length(2);

        // Verify that each rule is inserted in the DOM, wrapped in the context block.
        const expected1 = `${context} { ${selector} { ${toString(styles[0])} } }`;
        const expected2 = `${context} { ${selector} { ${toString(styles[1])} } }`;
        expect(rules[0].cssText).to.eql(expected1);
        expect(rules[1].cssText).to.eql(expected2);
      });

      it('scenario: 1', () => {
        const { sheet } = setup();
        const container = sheet.container('min-width: 600px');
        sheet.rule('.card h2', { fontSize: 50 });
        container.rules.add('.card h2', { fontSize: 200 });
        expect(container.rules.items[0].rule).to.eql(
          `@container (min-width: 600px) { .card h2 { font-size: 200px; } }`,
        );
      });
    });

    describe('scope', () => {
      it('nested ".classname" selector', () => {
        const { sheet } = setup();
        const a = sheet.container('my-name', 'min-width: 700px');
        const b = a.scope('.foo');

        expect(b.condition).to.eql(a.condition);
        expect(b.name).to.eql(a.name);
        expect(b).to.not.equal(a);

        expect(a.scoped).to.eql([]);
        expect(b.scoped).to.eql(['.foo']);

        a.rules.add('h1', { color: 'red' });
        b.rules.add('h1', { color: 'red' });

        expect(a.toString('CssSelector')).to.eql(
          '@container my-name (min-width: 700px) { h1 { color: red; } }',
        );

        expect(b.toString('CssSelector')).to.eql(
          '@container my-name (min-width: 700px) { .foo h1 { color: red; } }',
        );
      });

      it('multi-level nesting', () => {
        const { sheet } = setup();
        const a = sheet.container('min-width: 700px');
        const b = a.scope('.foo');
        const c = b.scope('.bar');
        expect(c.scoped).to.eql(['.foo', '.bar']);

        b.rules.add('h2', { color: 'red' });
        c.rules.add('h2', { color: 'red' });

        const str1 = b.toString('CssSelector');
        const str2 = c.toString('CssSelector');

        expect(str1).to.eql('@container (min-width: 700px) { .foo h2 { color: red; } }');
        expect(str2).to.eql('@container (min-width: 700px) { .foo .bar h2 { color: red; } }');
      });
    });
  },
);
