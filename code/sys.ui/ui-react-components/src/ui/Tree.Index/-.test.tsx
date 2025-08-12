import { type t, describe, expect, it } from '../../-test.ts';
import { IndexTreeItem } from '../Tree.Index.Item/mod.ts';

import { Yaml } from './m.Yaml.ts';
import { toSeq } from './m.Yaml.u.ts';
import { IndexTree } from './mod.ts';
import { IndexTree as View } from './ui.tsx';

describe('Tree.Index', () => {
  it('API', async () => {
    const m = await import('@sys/ui-react-components');
    expect(m.IndexTree).to.equal(IndexTree);
    expect(IndexTree.View).to.equal(View);
    expect(IndexTree.Item.View).to.equal(IndexTreeItem);
    expect(IndexTree.Yaml).to.equal(Yaml);
  });

  describe('YAML dialect', () => {
    /**
     * Sample sources (mirror the docs exactly)
     */
    const SOURCE_BASE: Record<string, t.YamlTreeSourceNode> = {
      'Getting Started': 'crdt:ref',
      Foo: { a: 1, b: 2 },
      Bar: {
        '.': { label: 'Bar (custom)' },
        a: 1,
        b: 2,
      },
      Examples: {
        '.': { note: 'group', id: 'examples' },
        info: 'group details',
        children: [{ SubTree: 'foo' }, { Bar: 'hello' }],
      },
      Section: {
        children: {
          A: 'ref:a',
          B: 'ref:b',
        },
      },
      ArrLeaf: [1, 2, 3], // ← array leaf (must remain a leaf, not confused with list).
    } as const;

    describe('YAML dialect → normalized Tree', () => {
      it('normalizes leaves and branches (baseline semantics)', () => {
        const list = Yaml.from(SOURCE_BASE);

        // Order: array order === render order
        expect(list.map((n) => labelToString(n.label))).to.eql([
          'Getting Started',
          'Foo',
          'Bar (custom)',
          'Examples',
          'Section',
          'ArrLeaf',
        ]);

        // Scalar leaf:
        const a = list[0];
        expect(a.key).to.eql('Getting Started');
        expect(a.value).to.eql('crdt:ref');
        expect(a.children).to.be.undefined;

        // Plain object as leaf (no "." or "children"):
        const foo = list[1];
        expect(foo.key).to.eql('Foo');
        expect(foo.value).to.eql({ a: 1, b: 2 });

        // Leaf with meta + own data payload (still a leaf; no children):
        const bar = list[2];
        expect(labelToString(bar.label)).to.eql('Bar (custom)');
        expect(bar.meta).to.eql({ label: 'Bar (custom)' });
        expect(bar.value).to.eql({ a: 1, b: 2 });
        expect(bar.children).to.be.undefined;

        // Branch with id override, children via ordered array:
        const ex = list[3];
        expect(ex.key).to.eql('examples'); // id override
        expect(labelToString(ex.label)).to.eql('Examples');
        expect(ex.meta).to.eql({ note: 'group', id: 'examples' });
        expect(ex.value).to.eql({ info: 'group details' }); // non-reserved keys → value
        expect(ex.children?.map((n) => labelToString(n.label))).to.eql(['SubTree', 'Bar']);
        expect(ex.children?.[0].key).to.eql('examples/SubTree');
        expect(ex.children?.[1].value).to.eql('hello');

        // Branch with children as record (insertion order):
        const sec = list[4];
        expect(labelToString(sec.label)).to.eql('Section');
        expect(sec.children?.map((n) => labelToString(n.label))).to.eql(['A', 'B']);

        // Array leaf stays a leaf:
        const arr = list[5];
        expect(Array.isArray(arr.value)).to.eql(true);
        expect(arr.children).to.be.undefined;
      });

      it('accepts root as sequence of single-entry maps and preserves order', () => {
        const list = Yaml.from(toSeq(SOURCE_BASE));

        // Exact order from YAML sequence:
        expect(list.map((n) => labelToString(n.label))).to.eql([
          'Getting Started',
          'Foo',
          'Bar (custom)',
          'Examples',
          'Section',
          'ArrLeaf',
        ]);

        // Spot checks:
        expect(list[0].value).to.eql('crdt:ref'); //                ← scalar leaf
        expect(list[2].meta).to.eql({ label: 'Bar (custom)' }); //  ← meta label leaf
        expect(list[3].key).to.eql('examples'); //                  ← id override
        expect(list[5].children).to.be.undefined; //                ← array leaf remains a leaf
      });

      it('deterministic output (idempotent)', () => {
        const a = Yaml.from(SOURCE_BASE);
        const b = Yaml.from(SOURCE_BASE);
        expect(a).to.eql(b);
        expect(a).to.not.equal(b);
      });

      it('`at` supports string and [ObjectPath] forms, plus "id" overrides', () => {
        const list = Yaml.from(SOURCE_BASE);

        // by ObjectPath:
        const a = Yaml.at(list, toObjectPath('examples'));
        expect(a.map((n) => n.label)).to.eql(['SubTree', 'Bar']);

        // deep path by literal labels:
        const b = Yaml.at(list, toObjectPath('Section/A'));
        expect(b).to.eql([]); // 'A' is a leaf, so no children.

        // "id" override path (examples has meta.id = 'examples'):
        const c = Yaml.at(list, toObjectPath('examples'));
        expect(c.map((n) => n.label)).to.eql(['SubTree', 'Bar']); // already covered, but this is the id form

        // explicit test that a renamed label with same id still resolves:
        const src2 = {
          Examples: {
            '.': { note: 'group', id: 'examples', label: 'Examples (renamed)' },
            children: [{ SubTree: 'foo' }],
          },
        } as const;
        const list2 = Yaml.from(src2);
        const d = Yaml.at(list2, toObjectPath('examples'));
        expect(d.map((n) => n.label)).to.eql(['SubTree']);

        // empty path returns root
        const e = Yaml.at(list, [] as t.ObjectPath);
        expect(e).to.eql(list);
      });

      it('`find` by exact key and by predicate', () => {
        const list = Yaml.from(SOURCE_BASE);

        const byKey = Yaml.find(list, 'examples/Bar');
        expect(byKey?.label).to.eql('Bar');
        expect(byKey?.value).to.eql('hello');

        const byPred = Yaml.find(
          list,
          ({ node, parents }) => node.label === 'Foo' && parents.length === 0,
        );
        expect(byPred?.key).to.eql('Foo');
      });

      it('heuristic: inferPlainObjectsAsBranches = true makes mapping-only nodes branches', () => {
        const src = { Node: { a: 1, b: 2 } } as const;
        const leaf = Yaml.from(src); // default: plain object → leaf
        expect(leaf[0].value).to.eql({ a: 1, b: 2 });
        expect(leaf[0].children).to.be.undefined;

        const branchy = Yaml.from(src, { inferPlainObjectsAsBranches: true });
        expect(branchy[0].children?.map((n) => n.label)).to.eql(['a', 'b']);
        expect(branchy[0].value).to.be.undefined;
      });

      it('id override creates stable deep-link keys independent of label changes', () => {
        const src = {
          Node: {
            '.': { id: 'x', label: 'Node v1' },
            children: [{ Child: 1 }],
          },
        } as const;

        const v1 = Yaml.from(src);
        expect(v1[0].key).to.eql('x');

        // rename label, keep id
        const src2 = {
          Node: {
            '.': { id: 'x', label: 'Node v2' },
            children: [{ Child: 1 }],
          },
        } as const;

        const v2 = Yaml.from(src2);
        expect(v2[0].key).to.eql('x');
        expect(v2[0].label).to.eql('Node v2');
      });
    });

    describe('YAML dialect with JSX labels', () => {
      it('coerces JSX.Element labels in tests for safe equality checks', () => {
        const src = {
          Foo: {
            '.': { label: <span>Custom</span> },
            a: 1,
          },
          Bar: 'baz',
        } as const;

        const list = Yaml.from(src);

        const labels = list.map((n) => labelToString(n.label));
        expect(labels).to.eql(['<span>', 'Bar']); // JSX preserved, coerced for comparison

        // sanity: original JSX still present on the node
        expect(typeof list[0].label).to.eql('object');
        expect(labelToString(list[0].label)).to.eql('<span>');

        // `at` works the same
        const fooChildren = Yaml.at(list, toObjectPath('Foo'));
        expect(fooChildren).to.eql([]); // Foo is a leaf
      });
    });
  });
});

/**
 * Helpers:
 */
const toObjectPath = (s: string): t.ObjectPath => s.split('/');
function labelToString(label: string | t.JSX.Element) {
  if (typeof label === 'string') return label;
  return `<${(label.type as string) || 'element'}>`;
}
