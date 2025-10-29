import { describe, expect, expectTypeOf, it } from '../../../-test.ts';
import { type t, Value } from '../common.ts';
import { Is, SlugTreeItemSchema, SlugTreePropsSchema, Traits } from '../mod.ts';

describe('trait: slug-tree', () => {
  describe('exports / shapes', () => {
    it('Traits exposes slug-tree schemas', () => {
      expect(Traits.Schema.SlugTree.Item).to.equal(SlugTreeItemSchema);
      expect(Traits.Schema.SlugTree.Props).to.equal(SlugTreePropsSchema);
    });

    it('type surface: t.SlugTreeItem / t.SlugTreeProps compile', () => {
      const item: t.SlugTreeItem = { name: 'x' };
      const props: t.SlugTreeProps = { slugs: [item] };
      expectTypeOf(item).toEqualTypeOf<t.SlugTreeItem>();
      expectTypeOf(props).toEqualTypeOf<t.SlugTreeProps>();
    });
  });

  describe('Value.Check (schema truth)', () => {
    it('valid: minimal empty tree', () => {
      const ok: t.SlugTreeProps = { slugs: [] };
      expect(Value.Check(SlugTreePropsSchema, ok)).to.eql(true);
      expect(Is.slugTreeProps(ok)).to.eql(true);
    });

    it('valid: leaf node (name + ref)', () => {
      const ok: t.SlugTreeProps = { slugs: [{ name: 'intro', ref: 'crdt:create' }] };
      expect(Value.Check(SlugTreePropsSchema, ok)).to.eql(true);
    });

    it('valid: group node (name + items)', () => {
      const ok = {
        slugs: [{ name: 'section', slugs: [{ name: 'child', ref: 'crdt:create' }] }],
      } as const;
      expect(Value.Check(SlugTreePropsSchema, ok)).to.eql(true);
    });

    it('valid: hybrid node (name + ref + items)', () => {
      const ok = {
        slugs: [
          { name: 'hybrid', ref: 'crdt:create', slugs: [{ name: 'child', ref: 'crdt:create' }] },
        ],
      } as const;
      expect(Value.Check(SlugTreePropsSchema, ok)).to.eql(true);
    });

    it('valid: deep nesting (3+ levels)', () => {
      const ok = {
        slugs: [
          {
            name: 'lvl1',
            slugs: [
              {
                name: 'lvl2',
                slugs: [{ name: 'lvl3', slugs: [{ name: 'leaf', ref: 'crdt:create' }] }],
              },
            ],
          },
        ],
      } as const;
      expect(Value.Check(SlugTreePropsSchema, ok)).to.eql(true);
    });

    it('valid: descriptions (root + item)', () => {
      const ok: t.SlugTreeProps = {
        description: 'root description',
        slugs: [{ name: 'node', description: 'node description', ref: 'crdt:create' }],
      };
      expect(Value.Check(SlugTreePropsSchema, ok)).to.eql(true);
    });
  });

  describe('Value.Check (invalid cases)', () => {
    it('invalid: missing name', () => {
      const bad = { slugs: [{ ref: 'crdt:create' }] };
      expect(Value.Check(SlugTreePropsSchema, bad)).to.eql(false);
      expect(Is.slugTreeProps(bad)).to.eql(false);
    });

    it('invalid: items must be an array when present', () => {
      const bad = { slugs: [{ name: 'x', slugs: {} }] };
      expect(Value.Check(SlugTreePropsSchema, bad)).to.eql(false);
    });

    it('invalid: additionalProperties on item is rejected', () => {
      const bad = { slugs: [{ name: 'x', ref: 'crdt:create', foo: 1 }] };
      expect(Value.Check(SlugTreePropsSchema, bad)).to.eql(false);
    });

    it('invalid: bad ref pattern', () => {
      const bad = { slugs: [{ name: 'x', ref: 'not-a-crdt-ref' }] };
      expect(Value.Check(SlugTreePropsSchema, bad)).to.eql(false);
    });

    it('invalid: empty name', () => {
      const bad = { slugs: [{ name: '', ref: 'crdt:create' }] };
      expect(Value.Check(SlugTreePropsSchema, bad)).to.eql(false);
    });
  });

  describe('edge behavior', () => {
    it('group with empty items array is still valid (represents an empty section)', () => {
      const ok = { slugs: [{ name: 'empty', slugs: [] }] } as const;
      expect(Value.Check(SlugTreePropsSchema, ok)).to.eql(true);
    });

    it('multiple siblings with same name are allowed by schema (identity is by position); lint later if desired', () => {
      const ok = {
        slugs: [
          { name: 'dup', ref: 'crdt:create' },
          { name: 'dup', slugs: [{ name: 'child', ref: 'crdt:create' }] },
        ],
      } as const;
      expect(Value.Check(SlugTreePropsSchema, ok)).to.eql(true);
    });
  });
});
