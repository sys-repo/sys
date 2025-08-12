import { type t, Obj, describe, expect, it } from '../../-test.ts';
import { IndexTreeItem } from '../Tree.Index.Item/mod.ts';

import { Is } from './m.Is.ts';
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
    expect(IndexTree.Is).to.equal(Is);
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
        expect(a.key).to.eql('/Getting Started');
        expect(a.value).to.eql('crdt:ref');
        expect(a.children).to.be.undefined;

        // Plain object as leaf (no "." or "children"):
        const foo = list[1];
        expect(foo.key).to.eql('/Foo');
        expect(foo.value).to.eql({ a: 1, b: 2 });

        // Leaf with meta + own data payload (still a leaf; no children):
        const bar = list[2];
        expect(labelToString(bar.label)).to.eql('Bar (custom)');
        expect(bar.meta).to.eql({ label: 'Bar (custom)' });
        expect(bar.value).to.eql({ a: 1, b: 2 });
        expect(bar.children).to.be.undefined;

        // Branch with id override, children via ordered array:
        const ex = list[3];
        expect(ex.key).to.eql('/examples'); // ← id override (pointer-encoded).
        expect(labelToString(ex.label)).to.eql('Examples');
        expect(ex.meta).to.eql({ note: 'group', id: 'examples' });
        expect(ex.value).to.eql({ info: 'group details' }); // ← non-reserved keys → value.
        expect(ex.children?.map((n) => labelToString(n.label))).to.eql(['SubTree', 'Bar']);
        expect(ex.children?.[0].key).to.eql('/examples/SubTree');
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
        expect(list[3].key).to.eql('/examples'); //                  ← id override (pointer-encoded)
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
        expect(b).to.eql([]); // ← 'A' is a leaf, so no children.

        // "id" override path (examples has meta.id = 'examples'):
        const c = Yaml.at(list, toObjectPath('examples'));
        expect(c.map((n) => n.label)).to.eql(['SubTree', 'Bar']); // ← already covered, but this is the id form.

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

        const byKey = Yaml.find(list, '/examples/Bar');
        expect(byKey?.label).to.eql('Bar');
        expect(byKey?.value).to.eql('hello');

        const byPred = Yaml.find(
          list,
          ({ node, parents }) => node.label === 'Foo' && parents.length === 0,
        );
        expect(byPred?.key).to.eql('/Foo');
      });

      it('heuristic: inferPlainObjectsAsBranches = true makes mapping-only nodes branches', () => {
        const src = { Node: { a: 1, b: 2 } } as const;
        const leaf = Yaml.from(src); // ← default: plain object → leaf.
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
        expect(v1[0].key).to.eql('/x');

        // rename label, keep id
        const src2 = {
          Node: {
            '.': { id: 'x', label: 'Node v2' },
            children: [{ Child: 1 }],
          },
        } as const;

        const v2 = Yaml.from(src2);
        expect(v2[0].key).to.eql('/x');
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

    describe('YAML dialect - parse from text (yaml)', () => {
      describe('YAML dialect - parse from text (yaml)', () => {
        it('parses mapping root and normalizes (order, meta, children)', () => {
          const yaml = `
Getting Started: crdt:ref

Foo:
  a: 1
  b: 2

Bar:
  .: { label: 'Bar (custom)' }
  a: 1
  b: 2

Examples:
  .: { note: 'group', id: 'examples' }
  info: 'group details'
  children:
    - SubTree: foo
    - Bar: hello

Section:
  children:
    A: ref:a
    B: ref:b

ArrLeaf:
  - 1
  - 2
  - 3
`.trim();

          const list = Yaml.parse(yaml);

          // top-level order
          expect(list.map((n) => labelToString(n.label))).to.eql([
            'Getting Started',
            'Foo',
            'Bar (custom)',
            'Examples',
            'Section',
            'ArrLeaf',
          ]);

          // key semantics + value carry-through
          expect(list[0].key).to.eql('/Getting Started');
          expect(list[0].value).to.eql('crdt:ref');

          // plain object as leaf
          expect(list[1].value).to.eql({ a: 1, b: 2 });

          // meta label leaf
          expect(labelToString(list[2].label)).to.eql('Bar (custom)');
          expect(list[2].meta).to.eql({ label: 'Bar (custom)' });

          // branch with id override + ordered children
          const ex = list[3];
          expect(ex.key).to.eql('/examples');
          expect(ex.value).to.eql({ info: 'group details' });
          expect(ex.children?.map((n) => labelToString(n.label))).to.eql(['SubTree', 'Bar']);
          expect(ex.children?.[1].value).to.eql('hello');

          // children as record (insertion order)
          const sec = list[4];
          expect(sec.children?.map((n) => labelToString(n.label))).to.eql(['A', 'B']);

          // array leaf remains a leaf
          const arr = list[5];
          expect(Array.isArray(arr.value)).to.eql(true);

          // spot-check path navigation works post-parse
          const kids = Yaml.at(list, toObjectPath('examples'));
          expect(kids.map((n) => labelToString(n.label))).to.eql(['SubTree', 'Bar']);
        });

        it('parses sequence root (single-entry maps) and preserves explicit order', () => {
          const yaml = `
- Getting Started: crdt:ref
- Foo:
    a: 1
    b: 2
- Bar:
    .: { label: 'Bar (custom)' }
    a: 1
    b: 2
- Examples:
    .: { note: 'group', id: 'examples' }
    info: 'group details'
    children:
      - SubTree: foo
      - Bar: hello
- Section:
    children:
      A: ref:a
      B: ref:b
- ArrLeaf:
    - 1
    - 2
    - 3
`.trim();

          const list = Yaml.parse(yaml);
          expect(list.map((n) => labelToString(n.label))).to.eql([
            'Getting Started',
            'Foo',
            'Bar (custom)',
            'Examples',
            'Section',
            'ArrLeaf',
          ]);

          // "id" override still applies.
          expect(list[3].key).to.eql('/examples');
        });

        it('empty or whitespace input → empty tree', () => {
          expect(Yaml.parse('')).to.eql([]);
          expect(Yaml.parse('   \n')).to.eql([]);
        });
      });
    });
  });

  describe('Tree.Index.Is', () => {
    it('identifies a TreeNodeList', () => {
      const nodeList: t.TreeNodeList = [
        { key: '1', label: 'One', path: ['1'] as t.ObjectPath },
        { key: '2', label: 'Two', path: ['2'] as t.ObjectPath },
      ];
      expect(IndexTree.Is.list(nodeList)).to.eql(true);
      expect(IndexTree.Is.node(nodeList)).to.eql(false);
    });

    it('identifies a single TreeNode', () => {
      const node: t.TreeNode = { key: '1', label: 'One', path: ['1'] as t.ObjectPath };
      expect(IndexTree.Is.node(node)).to.eql(true);
      expect(IndexTree.Is.list(node)).to.eql(false);
    });
  });

  describe('Tree.Index.toList', () => {
    it('<undefined> → empty list', () => {
      const out = IndexTree.toList(undefined);
      expect(out).to.eql([]);
    });

    it('passes through a TreeNodeList unchanged (including order)', () => {
      const list: t.TreeNodeList = [
        { key: 'a', label: 'A', path: ['a'] as t.ObjectPath },
        { key: 'b', label: 'B', path: ['b'] as t.ObjectPath },
      ];
      const out = IndexTree.toList(list);
      expect(out).to.equal(list); // ← same reference is fine/expected.
      expect(out.map((n) => n.key)).to.eql(['a', 'b']);
    });

    it('TreeNode with children → that children list', () => {
      const node: t.TreeNode = {
        key: 'root',
        label: 'Root',
        path: ['root'] as t.ObjectPath,
        children: [
          { key: 'root/one', label: 'One', path: ['root', 'one'] as t.ObjectPath },
          { key: 'root/two', label: 'Two', path: ['root', 'two'] as t.ObjectPath },
        ],
      };
      const out = IndexTree.toList(node);
      expect(out.map((n) => n.key)).to.eql(['root/one', 'root/two']);
    });

    it('TreeNode without children → singleton list [node]', () => {
      const node: t.TreeNode = { key: 'leaf', label: 'Leaf', path: ['leaf'] as t.ObjectPath };
      const out = IndexTree.toList(node);
      expect(out.length).to.eql(1);
      expect(out[0].key).to.eql('leaf');
    });

    it('empty TreeNodeList stays empty', () => {
      const out = IndexTree.toList([] as t.TreeNodeList);
      expect(out).to.eql([]);
    });
  });

  describe('Tree.Index - path encoding', () => {
    it('encodes "/" and "~" per RFC6901 (~1, ~0) and roundtrips', () => {
      const path = asObjectPath('seg/with/slash', 'tilde~here', 'mixed~/slash');
      const key = Obj.Path.Codec.pointer.encode(path);
      expect(key).to.eql('/seg~1with~1slash/tilde~0here/mixed~0~1slash');

      const back = Obj.Path.Codec.pointer.decode(key);
      expect(back).to.eql(path);
    });

    it('handles empty and simple segments', () => {
      const path = asObjectPath('', 'a', 'b c'); // empty + space
      const key = Obj.Path.Codec.pointer.encode(path);
      expect(key).to.eql('//a/b c'); // leading empty segment → extra '/'
      expect(Obj.Path.Codec.pointer.decode(key)).to.eql(path);
    });
  });

  describe('Tree.Index - normalized nodes carry path and encoded key', () => {
    it('labels and ids with "/" or "~" are safe', () => {
      const src = {
        'A/B': {
          '.': { id: 'id/with/slash', label: 'A/B label' },
          children: [{ 'C~D': 1 }, { 'E/F': { '.': { id: 'E~id' }, children: [{ 'G/H~I': 2 }] } }],
        },
      } as const;

      const list = Yaml.from(src);
      const a = list[0];
      expect(a.path).to.eql(asObjectPath('id/with/slash')); //  ← raw.
      expect(a.key).to.eql('/id~1with~1slash'); //              ← encoded (leading slash).

      const c = a.children![0];
      expect(c.path).to.eql(asObjectPath('id/with/slash', 'C~D'));
      expect(c.key).to.eql('/id~1with~1slash/C~0D');

      const e = a.children![1];
      expect(e.path).to.eql(asObjectPath('id/with/slash', 'E~id'));
      expect(e.key).to.eql('/id~1with~1slash/E~0id');

      const g = e.children![0];
      expect(g.path).to.eql(asObjectPath('id/with/slash', 'E~id', 'G/H~I'));
      expect(g.key).to.eql('/id~1with~1slash/E~0id/G~1H~0I');
    });

    it('Yaml.at navigates using raw ObjectPath (no parsing)', () => {
      const src = {
        Root: {
          '.': { id: 'r' },
          children: [{ 'A/B': 1 }, { 'C~D': 2 }],
        },
      } as const;

      const list = Yaml.from(src);
      const children = Yaml.at(list, asObjectPath('r')); // ← by raw path segment (with slash in id).
      expect(children.map((n) => n.key)).to.eql(['/r/A~1B', '/r/C~0D']);
    });
  });
});

/**
 * Helpers:
 */
const asObjectPath = (...segs: string[]) => segs as unknown as t.ObjectPath;
const toObjectPath = (s: string): t.ObjectPath => s.split('/') as t.ObjectPath;
function labelToString(label: string | t.JSX.Element) {
  if (typeof label === 'string') return label;
  return `<${(label.type as string) || 'element'}>`;
}
