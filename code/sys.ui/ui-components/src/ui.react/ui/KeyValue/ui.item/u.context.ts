import { type t } from '../common.ts';
import { type CursorArrivalCue } from '../m.Cursor/u/use.arrival.ts';
import { type ProjectionAnimationModel } from '../u/mod.ts';

export type RenderContext = Omit<t.KeyValue.ItemProps, 'item'> & {
  readonly layout: t.KeyValue.Layout;
  readonly rootItems: t.KeyValue.Item[];
  readonly cursor?: t.KeyValue.Cursor.Props;
  readonly cursorCurrentFill: t.Color.Rgba;
  readonly cursorArrival?: CursorArrivalCue;
  readonly cursorPartFill: t.Color.Rgba;
  readonly projection?: ProjectionAnimationModel;
};

export function toItemContext(context: RenderContext): Omit<t.KeyValue.ItemProps, 'item'> {
  return {
    enabled: context.enabled,
    disabledOpacity: context.disabledOpacity,
    mono: context.mono,
    truncate: context.truncate,
    layout: context.layout,
    size: context.size,
    debug: context.debug,
    theme: context.theme,
    style: context.style,
  };
}
