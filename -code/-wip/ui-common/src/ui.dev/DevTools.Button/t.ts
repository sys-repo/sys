import type { t } from '../../common.ts';

type O = Record<string, unknown>;
type IconInput = JSX.Element | false;
type RightInput = string | JSX.Element | false;
type SpinnerInput = boolean;

/**
 * Button
 */
export type DevButtonHandler<S extends O = O> = (e: DevButtonHandlerArgs<S>) => t.IgnoredResponse;
export type DevButtonHandlerArgs<S extends O = O> = {
  ctx: t.DevCtx;
  enabled(value: boolean | t.DevValueHandler<boolean, S>): DevButtonHandlerArgs<S>;
  icon(value: t.DevValueHandler<IconInput, S>): DevButtonHandlerArgs<S>;
  label(value: string | t.DevValueHandler<string, S>): DevButtonHandlerArgs<S>;
  right(value: RightInput | t.DevValueHandler<RightInput, S>): DevButtonHandlerArgs<S>;
  spinner(value: t.DevValueHandler<SpinnerInput, S>): DevButtonHandlerArgs<S>;
  onClick(fn: DevButtonClickHandler<S>): DevButtonHandlerArgs<S>;
  redraw(subject?: boolean): void;
};

/**
 * Button Click
 */
export type DevButtonClickHandler<S extends O = O> = (e: DevButtonClickHandlerArgs<S>) => void;
export type DevButtonClickHandlerArgs<S extends O = O> = DevButtonHandlerArgs<S> & {
  dev: t.DevRenderProps;
  state: t.DevCtxState<S>;
  change: t.DevCtxState<S>['change'];
  is: { meta: boolean; ctrl: boolean; shift: boolean; alt: boolean };
};
