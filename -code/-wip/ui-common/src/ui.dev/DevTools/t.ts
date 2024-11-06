import type { t } from '../../common.ts';

type O = Record<string, unknown>;
type SectionHandler<S extends O> = (dev: DevTools<S>) => void;

/**
 * Index of development tools (UI widgets).
 */
export type DevTools<S extends O = O> = {
  ctx: t.DevCtx;
  env<T>(): T;
  state(): Promise<t.DevCtxState<S>>;
  change: t.DevCtxState<S>['change'];
  redraw(target?: t.DevRedrawTarget): Promise<void>;

  header: t.DevCtxEdge;
  footer: t.DevCtxEdge;
  row: t.DevCtxDebug<S>['row'];

  /**
   * Helpers.
   */
  lorem(words?: number, endWith?: string): string;

  // NB: Useful for logically grouping blocks.
  section(title: string | [string, string], fn?: SectionHandler<S>): DevTools<S>;
  section(fn: SectionHandler<S>): DevTools<S>;

  /**
   * Widgets.
   */
  title(text: string | [string, string], style?: t.DevTitleStyle): DevTools<S>;
  title(fn: t.DevTitleHandler<S>): DevTools<S>;

  button(label: string | [string, string], onClick?: t.DevButtonClickHandler<S>): DevTools<S>;
  button(fn: t.DevButtonHandler<S>): DevTools<S>;

  boolean(fn: t.DevBooleanHandler<S>): DevTools<S>;

  textbox(fn: t.DevTextboxHandler<S>): DevTools<S>;

  TODO(text?: string, style?: t.DevTodoStyle): DevTools<S>;
  TODO(fn: t.DevTodoHandler<S>): DevTools<S>;

  hr(): DevTools<S>;
  hr(
    line: t.DevHrThickness | [t.DevHrThickness, t.DevHrOpacity],
    margin?: t.DevHrMargin,
    color?: t.DevHrColor,
  ): DevTools<S>;
  hr(fn: t.DevHrHandler<S>): DevTools<S>;

  bdd(fn: t.DevBddHandler<S>): DevTools<S>;
};

/**
 * Builder tool for constructing hyperlinks.
 */
export type DevLinks = {
  title(text: string | [string, string]): DevLinks;
  button(label: string, target: string): DevLinks;
  hr(line?: number | [number, number], margin?: t.DevHrMargin): DevLinks;
};
