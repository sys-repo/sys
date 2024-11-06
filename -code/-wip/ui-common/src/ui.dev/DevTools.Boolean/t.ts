import type { t } from '../../common.ts';

type O = Record<string, unknown>;
type BoolOrUndefined = boolean | undefined;

/**
 * Boolean
 */
export type DevBooleanHandler<S extends O = O> = (e: DevBooleanHandlerArgs<S>) => t.IgnoredResponse;
export type DevBooleanHandlerArgs<S extends O = O> = {
  ctx: t.DevCtx;
  enabled(value: boolean | t.DevValueHandler<boolean, S>): DevBooleanHandlerArgs<S>;
  label(value: string | t.DevValueHandler<string, S>): DevBooleanHandlerArgs<S>;
  value(value: BoolOrUndefined | t.DevValueHandler<BoolOrUndefined, S>): DevBooleanHandlerArgs<S>;
  onClick(fn: DevBooleanClickHandler<S>): DevBooleanHandlerArgs<S>;
  redraw(subject?: boolean): void;
};

/**
 * Boolean Click
 */
export type DevBooleanClickHandler<S extends O = O> = (e: DevBooleanClickHandlerArgs<S>) => void;
export type DevBooleanClickHandlerArgs<S extends O = O> = DevBooleanHandlerArgs<S> & {
  dev: t.DevRenderProps;
  state: t.DevCtxState<S>;
  change: t.DevCtxState<S>['change'];
  current: boolean;
};
