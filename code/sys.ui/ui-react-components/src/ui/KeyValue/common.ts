import { type t, pkg, Pkg } from '../common.ts';

export * from '../common.ts';
export { A } from '../Anchor/mod.ts';

type P = t.KeyValueProps;

/**
 * Constants:
 */
const name = 'KeyValue';
const commonLayout = {
  columnGap: 20,
  rowGap: 4,
  align: 'baseline',
} satisfies NonNullable<t.KeyValueLayoutCommon>;

export const D = {
  name,
  displayName: Pkg.toString(pkg, name, false),

  keyOpacity: 0.5,
  size: 'sm' satisfies NonNullable<P['size']>,
  mono: false satisfies NonNullable<P['mono']>,
  truncate: true satisfies NonNullable<P['truncate']>,
  enabled: true satisfies NonNullable<P['enabled']>,

  defaults: { disabledOpacity: 0.5 } satisfies NonNullable<t.KeyValueDefaults>,
  spacer: { kind: 'spacer', size: 8 } satisfies NonNullable<t.KeyValueSpacer>,

  layout: {
    default: 'spaced' as const,
    spaced: { kind: 'spaced', ...commonLayout } satisfies NonNullable<t.KeyValueLayoutSpaced>,
    table: {
      kind: 'table',
      keyMax: '24ch',
      keyAlign: 'left',
      ...commonLayout,
    } satisfies NonNullable<t.KeyValueLayoutTable>,
  },
} as const;
export const DEFAULTS = D;
