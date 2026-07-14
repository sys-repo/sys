import { type t } from '../common.ts';
import { type ProjectionAnimationModel } from '../u/mod.ts';

export type RenderContext = Omit<t.KeyValue.ItemProps, 'item'> & {
  readonly layout: t.KeyValue.Layout;
  readonly rootItems: readonly t.KeyValue.Item[];
  readonly cursor?: t.KeyValue.Cursor.Props;
  readonly cursorCurrentFill: t.Color.Rgba;
  readonly cursorArrivalFill: t.Color.Rgba;
  readonly cursorArrivalKey?: string;
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
