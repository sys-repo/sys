import { type t, pkg, Pkg } from '../common.ts';
export * from '../common.ts';

type P = t.KeyValueProps;

/**
 * Constants:
 */
const name = 'KeyValue';
export const D = {
  name,
  displayName: Pkg.toString(pkg, name, false),

  size: 'sm' satisfies NonNullable<P['size']>,
  mono: true satisfies NonNullable<P['mono']>,
  truncate: true satisfies NonNullable<P['truncate']>,

  columns: { template: 'auto 1fr', gap: 12 } satisfies Required<NonNullable<P['columns']>>,
  spacer: { kind: 'spacer', size: 8 } satisfies Required<t.KeyValueSpacer>,
} as const;
export const DEFAULTS = D;
