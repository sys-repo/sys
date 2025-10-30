import { type t, Value } from './common.ts';
import { SlugTreePropsSchema } from './schema.slug/schema.slug.tree.ts';

export const Is: t.SlugTreeLib['Is'] = {
  /** slug-tree: props schema */
  props(u: unknown): u is t.SlugTreeProps {
    return Value.Check(SlugTreePropsSchema, u as unknown);
  },
};
