import type { t } from '../../common.ts';

type O = Record<string, unknown>;

export type DevHrMargin = number | [] | [number, number]; // [top, bottom].
export type DevHrColor = string | number;
export type DevHrThickness = number;
export type DevHrOpacity = number;

/**
 * HR: Horizontal-rule (visual divider).
 */
export type DevHrHandler<S extends O = O> = (e: DevHrHandlerArgs<S>) => t.IgnoredResponse;
export type DevHrHandlerArgs<S extends O = O> = {
  ctx: t.DevCtx;
  margin(value: DevHrMargin | t.DevValueHandler<DevHrMargin, S>): DevHrHandlerArgs<S>;
  color(value: DevHrColor | t.DevValueHandler<DevHrColor, S>): DevHrHandlerArgs<S>;
  thickness(value: DevHrThickness | t.DevValueHandler<DevHrThickness, S>): DevHrHandlerArgs<S>;
  opacity(value: DevHrOpacity | t.DevValueHandler<DevHrOpacity, S>): DevHrHandlerArgs<S>;
  redraw(subject?: boolean): void;
};
