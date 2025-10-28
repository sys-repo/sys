import { describe, expect, expectTypeOf, it } from '../../../-test.ts';
import { type t, Value } from '../common.ts';
import { SlugTreeItemSchema, SlugTreePropsSchema } from '../m.slug.tree.ts';
import { Is, Traits } from '../mod.ts';

describe('trait: slug-tree', () => {
  describe('exports / shapes', () => {
    it('Traits exposes slug-tree schemas', () => {
      expect(Traits.SlugTreeItemSchema).to.equal(SlugTreeItemSchema);
      expect(Traits.SlugTreePropsSchema).to.equal(SlugTreePropsSchema);
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

  describe('rounding out edge behavior', () => {
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
});
