import { type t, describe, expect, it } from '../../-test.ts';
import { fromYaml } from '../m.Slug.fromYaml.ts';

type O = Record<string, unknown>;

describe('trait normalizers (opts.normalizers) [mock]', () => {
  it('applies a provided normalizer for authoring DSL → canonical', () => {
    const src = `
      id: s1
      traits:
        - of: mock-tree
          as: tree
      data:
        tree:
          - my-named-thing:
              items:
                - topic-foo: crdt:2JgVjx9KAMcB3D6EZEyBB18jBX6P
                - topic-bar: crdt:create
    `;

    const res = fromYaml(src, undefined, {
      isKnown,
      normalizers: { 'mock-tree': mockTreeDslNormalizer },
    });

    expect(res.ok).to.eql(true);
    if (res.ok) {
      const tree = (res.slug as any)?.data?.tree;
      expect(Array.isArray(tree.items)).to.eql(true);
      expect(tree.items[0].name).to.eql('my-named-thing');
      expect(tree.items[0].items[0].name).to.eql('topic-foo');
      expect(tree.items[0].items[1].name).to.eql('topic-bar');
    }
  });

  it('is resilient when a normalizer throws (adds semantic error)', () => {
    const src = `
      id: s2
      traits:
        - of: mock-tree
          as: tree
      data:
        tree:
          - foo: {}
    `;

    const res = fromYaml(src, undefined, {
      isKnown,
      normalizers: {
        'mock-tree': () => {
          throw new Error('boom');
        },
      },
    });

    const sem = res.errors.semantic;
    expect(sem.length > 0).to.eql(true);
    expect(sem.some((e) => String(e.message).includes('normalizer/exception'))).to.eql(true);
  });

  it('does nothing when no matching trait id is provided in normalizers', () => {
    const src = `
      id: s3
      traits:
        - of: mock-tree
          as: tree
      data:
        tree:
          items:
            - name: a
              items:
                - name: b
                  ref: crdt:create
    `;

    const res = fromYaml(src, undefined, {
      isKnown,
      normalizers: { 'sample-a': passThrough },
    });

    expect(res.ok).to.eql(true);
    if (res.ok) {
      const tree = (res.slug as any)?.data?.tree;
      expect(tree.items[0].name).to.eql('a');
      expect(tree.items[0].items[0].name).to.eql('b');
    }
  });
});

/**
 * Helpers (test-only):
 */
function isKnown(id: string): boolean {
  // Known trait ids for tests that require registry awareness.
  // Keep these obviously fake to avoid confusion with real traits.
  return id === 'mock-tree' || id === 'sample-a' || id === 'sample-b';
}

function passThrough<T>(v: T): T {
  // Pass-through normalizer (identity).
  return v;
}

/**
 * Minimal authoring DSL → canonical converter used by tests.
 * Authoring forms supported:
 *   - Array of single-key mappings:
 *       - { "<name>": "<ref>" }
 *       - { "<name>": { ref?: string, items?: [...] } }
 * Canonical:
 *   - { items: [{ name: string, ref?: string, items?: [...] }] }
 */
export function mockTreeDslNormalizer(input: unknown): unknown {
  const toItem = (node: O): any => {
    const [name, value] = Object.entries(node ?? {})[0] ?? [];
    if (typeof name !== 'string') return undefined;

    const obj = value && typeof value === 'object' ? (value as O) : {};
    const ref = typeof (obj as any).ref === 'string' ? (obj as any).ref : undefined;

    const children = Array.isArray((obj as any).items)
      ? ((obj as any).items as O[])
          .map(toItem)
          .filter((v): v is NonNullable<typeof v> => Boolean(v))
      : [];

    const base: O = { name };
    if (ref) base.ref = ref;
    if (children.length) base.items = children;
    return base;
  };

  if (!Array.isArray(input)) return { items: [] };

  const items = (input as O[]).map(toItem).filter((v): v is NonNullable<typeof v> => Boolean(v));
  return { items };
}
