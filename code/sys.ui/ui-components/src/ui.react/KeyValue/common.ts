import { Pkg, pkg, type t } from '../common.ts';

export * from '../common.ts';
export { A } from '../Anchor/mod.ts';

type P = t.KeyValue.Props;

/**
 * Constants:
 */
const name = 'KeyValue';
const layout = {
  columnGap: 20,
  rowGap: 4,
  align: 'baseline',
} satisfies NonNullable<t.KeyValue.LayoutCommon>;

export const D = {
  name,
  displayName: Pkg.toString(pkg, name, false),
  keyOpacity: 0.5,
  size: 'sm' satisfies NonNullable<P['size']>,
  mono: false satisfies NonNullable<P['mono']>,
  truncate: true satisfies NonNullable<P['truncate']>,
  enabled: true satisfies NonNullable<P['enabled']>,
  defaults: { disabledOpacity: 0.5 } satisfies NonNullable<t.KeyValue.Defaults>,
  spacer: { kind: 'spacer', size: 8 } satisfies NonNullable<t.KeyValue.Spacer>,
  animation: { projection: { duration: 180 as t.Msecs, ease: 'easeOut' } },
  layout: {
    default: 'spaced' as const,
    spaced: { kind: 'spaced', ...layout } satisfies NonNullable<t.KeyValue.LayoutSpaced>,
    table: {
      kind: 'table',
      keyMax: '24ch',
      keyAlign: 'left',
      ...layout,
    } satisfies NonNullable<t.KeyValue.LayoutTable>,
  },
} as const;
export const DEFAULTS = D;
