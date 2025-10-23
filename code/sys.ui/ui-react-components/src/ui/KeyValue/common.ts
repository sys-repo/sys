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
  mono: false satisfies NonNullable<P['mono']>,
  truncate: true satisfies NonNullable<P['truncate']>,
  spacer: { kind: 'spacer', size: 8 } satisfies NonNullable<t.KeyValueSpacer>,
  layout: {
    variant: 'inline',
    keyMax: '24ch',
    keyAlign: 'left',
    columnGap: 12,
    rowGap: 4,
    align: 'baseline',
  } satisfies NonNullable<t.KeyValueLayout>,
} as const;
export const DEFAULTS = D;
