import type { t } from './common.ts';

type Id = string;
type SpecId = Id;
type Color = string | number;
type NumberOrNil = number | null | undefined;
type O = Record<string, unknown>;

/**
 * Context wrapper that manages a {ctx} object passed
 * into running spec.
 */
export type DevContext = t.Disposable & {
  readonly instance: t.DevInstance;
  readonly disposed: boolean;
  readonly pending: boolean;
  readonly ctx: t.DevCtx;
  flush(): Promise<DevContext>;
  refresh(): Promise<DevContext>;
  toObject(): t.DevCtxObject;
};

export type DevRedrawTarget = 'all' | 'subject' | 'harness' | 'debug';
export type DevFillMode = 'fill' | 'fill-x' | 'fill-y';
export type DevSubjectSize = [NumberOrNil, NumberOrNil];
export type DevPropDisplay = 'flex' | 'grid' | undefined;
export type DevCtxInput = t.DevCtx | t.TestHandlerArgs;

/**
 * The context {ctx} interface passed into specs.
 */
export type DevCtx = {
  readonly dispose$: t.Observable<void>;
  readonly subject: DevCtxSubject;
  readonly host: DevCtxHost;
  readonly debug: DevCtxDebug;
  readonly is: DevCtxIs;
  readonly env?: t.DevEnvVars;
  run(options?: { reset?: boolean; only?: SpecId | SpecId[] }): Promise<t.DevInfo>;
  redraw(target?: DevRedrawTarget): Promise<void>;
  state<T extends O>(initial: T): Promise<DevCtxState<T>>;
  toObject(): t.DevCtxObject;
};

/**
 * Context flags.
 */
export type DevCtxIs = {
  readonly initial: boolean; // Flag indicating if this is the initial run (or first run after a reset).
};

/**
 * A safe function mutator.
 */
export type DevCtxStateMutator<T extends O> = (draft: T) => t.IgnoredResponse;

/**
 * Immutable context state.
 */
export type DevCtxState<T extends O> = {
  current: T;
  change(fn: DevCtxStateMutator<T>): Promise<T>;
};

/**
 * A context object used to maintain state for a loaded DevHarness spec.
 */
export type DevCtxObject = {
  readonly id: Id;
  readonly instance: t.DevInstance;
  readonly props: t.DevRenderProps;
  readonly run: { count: number; is: DevCtxIs };
};

/**
 * Component (aka. "the main Subject")
 */
export type DevCtxSubject = {
  display(value: DevPropDisplay): DevCtxSubject;
  color(value?: Color | null): DevCtxSubject;
  backgroundColor(value?: Color | null): DevCtxSubject;
  size(value: DevSubjectSize): DevCtxSubject;
  size(mode: DevFillMode, margin?: t.CssMarginInput): DevCtxSubject;
  render<T extends O = O>(fn: t.DevRenderer<T>): DevCtxSubject;
};

/**
 * Subject Component Host ("Harness")
 */
export type DevCtxHost<S extends O = O> = {
  readonly header: DevCtxEdge<S>;
  readonly footer: DevCtxEdge<S>;
  color(value: Color | null): DevCtxHost<S>;
  backgroundColor(value: Color | null): DevCtxHost<S>;
  backgroundImage(value: t.DevBackgroundImageInput | t.UrlString | null): DevCtxHost<S>;
  tracelineColor(value: Color | null): DevCtxHost<S>;
  layer(index: number): DevCtxLayer<S>;
};

/**
 * Debug Panel
 */
export type DevCtxDebug<S extends O = O> = {
  row<T extends O = S>(input: t.DevRenderer<T> | JSX.Element): t.DevRenderRef;
  scroll(value: boolean): DevCtxDebug;
  padding(value: t.CssMarginInput | undefined | null): DevCtxDebug;
  width(value: number | null): DevCtxDebug;
  header: DevCtxEdge<S>;
  footer: DevCtxEdge<S>;
};

/**
 * Within a panel, properties representing the renderer for an edge.
 */
export type DevCtxEdge<S extends O = O> = {
  render<T extends O = S>(input: t.DevRenderer<T> | JSX.Element): DevCtxEdge<S>;
  border(color: Color | null): DevCtxEdge;
  padding(value: t.CssMarginInput | undefined | null): DevCtxEdge;
};

/**
 * A renderer targeting a specific layer.
 */
export type DevCtxLayer<S extends O = O> = {
  readonly index: number;
  render<T extends O = S>(input: t.DevRenderer<T> | JSX.Element): DevCtxLayer<S>;
};
