import { type t } from './common.ts';

/**
 * Tiny constructors for recipe nodes.
 * These are intentionally minimal and side-effect free.
 */
export const Value: t.ValueLib = {
  string: (o: Omit<t.StrSpec, 'kind'> = {}): t.StrSpec => ({ kind: 'string', ...o }),
  number: (o: Omit<t.NumSpec, 'kind'> = {}): t.NumSpec => ({ kind: 'number', ...o }),
  boolean: (o: Omit<t.BoolSpec, 'kind'> = {}): t.BoolSpec => ({ kind: 'boolean', ...o }),
  literal: (value: t.LitSpec['value']): t.LitSpec => ({ kind: 'literal', value }),

  array: (items: t.Recipe, o: Omit<t.ArrSpec, 'kind' | 'items'> = {}): t.ArrSpec => ({
    kind: 'array',
    items,
    ...o,
  }),

  object: (props: t.ObjSpec['props'], o: Omit<t.ObjSpec, 'kind' | 'props'> = {}): t.ObjSpec => ({
    kind: 'object',
    props,
    ...o,
  }),

  union: (
    variants: readonly t.Recipe[],
    o: Omit<t.UnionSpec, 'kind' | 'variants'> = {},
  ): t.UnionSpec => ({
    kind: 'union',
    variants,
    ...o,
  }),

  optional: (of: t.Recipe): t.OptSpec => ({ kind: 'optional', of }),
};
