import { describe, expect, expectTypeOf, it } from '../../../-test.ts';
import { type t, Value } from '../common.ts';
import { Is, SlugTreeItemSchema, SlugTreePropsSchema, Traits } from '../mod.ts';

describe('trait: slug-tree', () => {
  describe('exports / shapes', () => {
    it('Traits exposes slug-tree schemas', () => {
      expect(Traits.Schema.SlugTree.ItemSchema).to.equal(SlugTreeItemSchema);
      expect(Traits.Schema.SlugTree.PropsSchema).to.equal(SlugTreePropsSchema);
    });

    it('type surface: t.SlugTreeItem / t.SlugTreeProps compile', () => {
      const item: t.SlugTreeItem = { name: 'x' };
      const props: t.SlugTreeProps = { items: [item] };
      expectTypeOf(item).toEqualTypeOf<t.SlugTreeItem>();
      expectTypeOf(props).toEqualTypeOf<t.SlugTreeProps>();
    });
  });

  describe('Value.Check (schema truth)', () => {
    it('valid: minimal empty tree', () => {
      const ok: t.SlugTreeProps = { items: [] };
      expect(Value.Check(SlugTreePropsSchema, ok)).to.eql(true);
      expect(Is.slugTreeProps(ok)).to.eql(true);
    });

    it('valid: leaf node (name + ref)', () => {
      const ok: t.SlugTreeProps = { items: [{ name: 'intro', ref: 'crdt:create' }] };
      expect(Value.Check(SlugTreePropsSchema, ok)).to.eql(true);
    });

    it('valid: group node (name + items)', () => {
      const ok: t.SlugTreeProps = {
        items: [{ name: 'section', items: [{ name: 'child', ref: 'crdt:create' }] }],
      };
      expect(Value.Check(SlugTreePropsSchema, ok)).to.eql(true);
    });

    it('valid: hybrid node (name + ref + items)', () => {
      const ok: t.SlugTreeProps = {
        items: [
          { name: 'hybrid', ref: 'crdt:create', items: [{ name: 'child', ref: 'crdt:create' }] },
        ],
      };
      expect(Value.Check(SlugTreePropsSchema, ok)).to.eql(true);
    });

    it('valid: deep nesting (3+ levels)', () => {
      const ok: t.SlugTreeProps = {
        items: [
          {
            name: 'lvl1',
            items: [
              {
                name: 'lvl2',
                items: [{ name: 'lvl3', items: [{ name: 'leaf', ref: 'crdt:create' }] }],
              },
            ],
          },
        ],
      };
      expect(Value.Check(SlugTreePropsSchema, ok)).to.eql(true);
    });

    it('valid: summaries (root + item)', () => {
      const ok: t.SlugTreeProps = {
        summary: 'root summary',
        items: [{ name: 'node', summary: 'node summary', ref: 'crdt:create' }],
      };
      expect(Value.Check(SlugTreePropsSchema, ok)).to.eql(true);
    });
  });

  describe('Value.Check (invalid cases)', () => {
    it('invalid: missing name', () => {
      const bad = { items: [{ ref: 'crdt:create' }] };
      expect(Value.Check(SlugTreePropsSchema, bad)).to.eql(false);
      expect(Is.slugTreeProps(bad)).to.eql(false);
    });

    it('invalid: items must be an array when present', () => {
      const bad = { items: [{ name: 'x', items: {} }] };
      expect(Value.Check(SlugTreePropsSchema, bad)).to.eql(false);
    });

    it('invalid: additionalProperties on item is rejected', () => {
      const bad = { items: [{ name: 'x', ref: 'crdt:create', foo: 1 }] };
      expect(Value.Check(SlugTreePropsSchema, bad)).to.eql(false);
    });

    it('invalid: bad ref pattern', () => {
      const bad = { items: [{ name: 'x', ref: 'not-a-crdt-ref' }] };
      expect(Value.Check(SlugTreePropsSchema, bad)).to.eql(false);
    });

    it('invalid: empty name', () => {
      const bad = { items: [{ name: '', ref: 'crdt:create' }] };
      expect(Value.Check(SlugTreePropsSchema, bad)).to.eql(false);
    });
  });

  describe('edge behavior', () => {
    it('group with empty items array is still valid (represents an empty section)', () => {
      const ok: t.SlugTreeProps = { items: [{ name: 'empty', items: [] }] };
      expect(Value.Check(SlugTreePropsSchema, ok)).to.eql(true);
    });

    it('multiple siblings with same name are allowed by schema (identity is by position); lint later if desired', () => {
      const ok: t.SlugTreeProps = {
        items: [
          { name: 'dup', ref: 'crdt:create' },
          { name: 'dup', items: [{ name: 'child', ref: 'crdt:create' }] },
        ],
      };
      expect(Value.Check(SlugTreePropsSchema, ok)).to.eql(true);
    });
  });

  describe('normalizer', () => {
    const normalize = Traits.Normalizers['slug-tree'];

    it('sanity: assert CRDT ref pattern', () => {
      const a = Value.Check(SlugTreePropsSchema, { items: [{ name: 'x', ref: 'crdt:abc123' }] });
      const b = Value.Check(SlugTreePropsSchema, {
        items: [{ name: 'x', ref: 'crdt:2JgVjx9KAMcB3D6EZEyBB18jBX6P' }],
      });
      expect(a).to.eql(false);
      expect(b).to.eql(true);
    });

    it('transforms authoring DSL → canonical { items: [...] } (happy path)', () => {
      const authoring = [
        {
          'my-section': {
            items: [{ outline: 'crdt:create' }, { trailer: 'crdt:2JgVjx9KAMcB3D6EZEyBB18jBX6P' }],
          },
        },
      ] as const;

      const out = normalize(authoring);
      expect(Value.Check(SlugTreePropsSchema, out)).to.eql(true);

      // Shape checks
      const items = (out as { items: unknown }).items as readonly unknown[];
      expect(Array.isArray(items)).to.eql(true);
      const first = items[0] as { name: string; items?: unknown[] };
      expect(first.name).to.eql('my-section');
      expect(Array.isArray(first.items)).to.eql(true);

      const [a, b] = first.items as { name: string; ref?: string }[];
      expect(a.name).to.eql('outline');
      expect(a.ref).to.eql('crdt:create');
      expect(b.name).to.eql('trailer');
      expect(b.ref).to.eql('crdt:2JgVjx9KAMcB3D6EZEyBB18jBX6P');
    });

    it('returns {items: []} for non-array input (defensive default)', () => {
      const out1 = normalize(undefined);
      const out2 = normalize({ nope: true } as unknown);
      expect(Value.Check(SlugTreePropsSchema, out1)).to.eql(true);
      expect(Value.Check(SlugTreePropsSchema, out2)).to.eql(true);
      expect((out1 as { items: unknown[] }).items.length).to.eql(0);
      expect((out2 as { items: unknown[] }).items.length).to.eql(0);
    });

    it('filters malformed entries (multiple keys, non-object values)', () => {
      const authoring = [
        { good: 'crdt:create' },
        { bad: 'x', alsoBad: 'y' }, //  ← multiple keys → ignored
        'string', //                    ← ignored
        123, //                         ← ignored
        { ok: { ref: 'crdt:Zp3x7Tq9Lm2Nd6Gh8Jk1Rs4Vc5Bw' } },
      ] as unknown;

      const out = normalize(authoring);
      expect(Value.Check(SlugTreePropsSchema, out)).to.eql(true);

      const names = (out as { items: { name: string }[] }).items.map((i) => i.name);
      expect(names).to.eql(['good', 'ok']);
    });

    it('is pure (does not mutate input)', () => {
      const authoring = Object.freeze([
        Object.freeze({
          frozen: Object.freeze({
            items: Object.freeze([Object.freeze({ leaf: 'crdt:create' })]),
          }),
        }),
      ]);

      const snapshot = JSON.stringify(authoring);
      const _ = normalize(authoring);
      expect(JSON.stringify(authoring)).to.eql(snapshot);
    });

    it('produces items that individually satisfy SlugTreeItem schema', () => {
      const authoring = [{ section: { items: [{ child: 'crdt:create' }] } }];
      const out = normalize(authoring) as { items: unknown[] };
      const [section] = out.items;
      expect(Value.Check(SlugTreeItemSchema, section)).to.eql(true);
      const child = (section as { items: unknown[] }).items?.[0];
      expect(Value.Check(SlugTreeItemSchema, child)).to.eql(true);
    });

    it('normalizer is idempotent on canonical input (returns the same object)', () => {
      const canon: t.SlugTreeProps = { items: [{ name: 'x', ref: 'crdt:create', items: [] }] };
      const out = normalize(canon);
      expect(out).to.equal(canon); // identity
      expect(Value.Check(SlugTreePropsSchema, out)).to.eql(true);
    });

    it('normalize(authoring) → canonical; normalize(canonical) is a no-op', () => {
      const authoring = [{ section: { items: [{ child: 'crdt:create' }] } }];
      const a = normalize(authoring) as t.SlugTreeProps;
      const b = normalize(a);
      expect(b).to.equal(a); // identity
      expect(Value.Check(SlugTreePropsSchema, b)).to.eql(true);
    });
  });
});
