import { Is as BaseIs, type t, Value } from '../common.ts';
import { SlugTreePropsSchema } from '../schema.slug/schema.slug.tree.ts';

export const Is: t.SlugTreeLib['Is'] = {
  /** slug-tree: props schema */
  props(u: unknown): u is t.SlugTreeProps {
    return Value.Check(SlugTreePropsSchema, u as unknown);
  },

  /** True iff `u` is a ref-only slug-tree item (has `ref`). */
  itemRef(u: unknown): u is t.SlugTreeItemRefOnly {
    return (
      BaseIs.record(u) &&
      typeof (u as any).slug === 'string' &&
      (u as any).slug.length > 0 &&
      typeof (u as any).ref === 'string'
    );
  },

  /** True iff `u` is an inline slug-tree item (no `ref`). */
  itemInline(u: unknown): u is t.SlugTreeItemInline {
    return (
      BaseIs.record(u) &&
      typeof (u as any).slug === 'string' &&
      (u as any).slug.length > 0 &&
      (u as any).ref === undefined
    );
  },

  /** True iff `u` is a valid slug-tree item (ref-only or inline). */
  item(u: unknown): u is t.SlugTreeItem {
    return this.itemRef(u) || this.itemInline(u);
  },
};
