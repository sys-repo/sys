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
      const item: t.SlugTreeItem = { label: 'x' };
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

    it('valid: leaf node (label + ref)', () => {
      const ok: t.SlugTreeProps = { items: [{ label: 'intro', ref: 'crdt:create' }] };
      expect(Value.Check(SlugTreePropsSchema, ok)).to.eql(true);
    });

    it('valid: group node (label + items)', () => {
      const ok: t.SlugTreeProps = {
        items: [{ label: 'section', items: [{ label: 'child', ref: 'crdt:create' }] }],
      };
      expect(Value.Check(SlugTreePropsSchema, ok)).to.eql(true);
    });

    it('valid: hybrid node (label + ref + items)', () => {
      const ok: t.SlugTreeProps = {
        items: [
          { label: 'hybrid', ref: 'crdt:create', items: [{ label: 'child', ref: 'crdt:create' }] },
        ],
      };
      expect(Value.Check(SlugTreePropsSchema, ok)).to.eql(true);
    });

    it('valid: deep nesting (3+ levels)', () => {
      const ok: t.SlugTreeProps = {
        items: [
          {
            label: 'lvl1',
            items: [
              {
                label: 'lvl2',
                items: [{ label: 'lvl3', items: [{ label: 'leaf', ref: 'crdt:create' }] }],
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
        items: [{ label: 'node', summary: 'node summary', ref: 'crdt:create' }],
      };
      expect(Value.Check(SlugTreePropsSchema, ok)).to.eql(true);
    });
  });

  describe('Value.Check (invalid cases)', () => {
    it('invalid: missing label', () => {
      const bad = { items: [{ ref: 'crdt:create' }] };
      expect(Value.Check(SlugTreePropsSchema, bad)).to.eql(false);
      expect(Is.slugTreeProps(bad)).to.eql(false);
    });

    it('invalid: items must be an array when present', () => {
      const bad = { items: [{ label: 'x', items: {} }] };
      expect(Value.Check(SlugTreePropsSchema, bad)).to.eql(false);
    });

    it('invalid: additionalProperties on item is rejected', () => {
      const bad = { items: [{ label: 'x', ref: 'crdt:create', foo: 1 }] };
      expect(Value.Check(SlugTreePropsSchema, bad)).to.eql(false);
    });

    it('invalid: bad ref pattern', () => {
      const bad = { items: [{ label: 'x', ref: 'not-a-crdt-ref' }] };
      expect(Value.Check(SlugTreePropsSchema, bad)).to.eql(false);
    });

    it('invalid: empty label', () => {
      const bad = { items: [{ label: '', ref: 'crdt:create' }] };
      expect(Value.Check(SlugTreePropsSchema, bad)).to.eql(false);
    });
  });

  describe('rounding out edge behavior', () => {
    it('group with empty items array is still valid (represents an empty section)', () => {
      const ok: t.SlugTreeProps = { items: [{ label: 'empty', items: [] }] };
      expect(Value.Check(SlugTreePropsSchema, ok)).to.eql(true);
    });

    it('multiple siblings with same label are allowed by schema (identity is by position); lint later if desired', () => {
      const ok: t.SlugTreeProps = {
        items: [
          { label: 'dup', ref: 'crdt:create' },
          { label: 'dup', items: [{ label: 'child', ref: 'crdt:create' }] },
        ],
      };
      expect(Value.Check(SlugTreePropsSchema, ok)).to.eql(true);
    });
  });
});
