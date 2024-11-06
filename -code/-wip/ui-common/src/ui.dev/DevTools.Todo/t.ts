import type { t } from '../../common.ts';

type O = Record<string, unknown>;
type StyleArg<S extends O> = t.DevTodoStyle | t.DevValueHandler<t.DevTodoStyle, S> | null;

/**
 * Display title.
 */
export type DevTodoHandler<S extends O = O> = (e: DevTodoHandlerArgs<S>) => t.IgnoredResponse;
export type DevTodoHandlerArgs<S extends O = O> = {
  ctx: t.DevCtx;
  text(value: string | t.DevValueHandler<string, S>): DevTodoHandlerArgs<S>;
  style(value: StyleArg<S>): DevTodoHandlerArgs<S>;
  redraw(subject?: boolean): void;
};

export type DevTodoStyle = {
  margin?: t.CssValue['Margin'];
  color?: t.CssValue['color'];
};
