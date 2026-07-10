import { D, type t } from './common.ts';

/** Resolve KeyValue.Switches layout while preserving switch-specific defaults. */
export function toSwitchLayout(layout?: t.KeyValue.Layout): t.KeyValue.Layout {
  if (!layout) return D.layout;
  if (layout.kind !== 'spaced') return layout;
  return { ...D.layout, ...layout, align: layout.align ?? D.layout.align };
}
