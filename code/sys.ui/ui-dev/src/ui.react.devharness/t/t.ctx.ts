import type { t } from './common.ts';

type O = Record<string, unknown>;
type Id = string;
type SpecId = Id;
type Color = string | number;
type NumberOrNil = number | null | undefined;

/**
 * Context wrapper that manages a {ctx} object passed
 * into running spec.
 */
export type DevContext = t.Lifecycle & {
  readonly instance: t.DevInstance;
  readonly pending: boolean;
  readonly ctx: t.DevCtx;
  flush(): Promise<DevContext>;
  refresh(): Promise<DevContext>;
  toObject(): t.DevCtxObject;
};

/** DevHarness regions that can be asked to redraw. */
export type DevRedrawTarget = 'all' | 'subject' | 'harness' | 'debug';
/** Fill mode for sizing the spec subject within the host. */
export type DevFillMode = 'fill' | 'fill-x' | 'fill-y';
/** Optional width/height tuple for the spec subject. */
export type DevSubjectSize = [NumberOrNil, NumberOrNil];
/** CSS display modes supported by the subject shell. */
export type DevPropDisplay = 'flex' | 'grid' | undefined;
/** Values that can be coerced to a DevHarness context. */
export type DevCtxInput = t.DevCtx | t.TestHandlerArgs;

/**
 * The context {ctx} interface passed into specs.
 */
export type DevCtx = {
  readonly dispose$: t.Observable<t.DisposeEvent>;
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
  /**
   * Whether a new specimen attachment may begin now.
   * Closed through reset/replacement response delivery; reopens only when all transitions exit
   * and the context/controller remain live. Disposal is terminal; unbound contexts remain closed.
   * Re-read `ctx.is.attachable` at acquisition boundaries; do not cache `ctx.is`.
   * This is not a reservation, reset success, cancellation, or permission to mutate context state.
   */
  readonly attachable: boolean;
};

/** Mutates a draft of specimen state. */
export type DevCtxStateMutator<T extends O> = (draft: T) => t.IgnoredResult;

/** Specimen state handle; update through `change`. */
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
  size(mode?: DevFillMode, margin?: t.CssMarginInput): DevCtxSubject;
  render<T extends O = O>(fn: t.DevRenderer<T>): DevCtxSubject;
};

/**
 * The host surface around the subject.
 */
export type DevCtxHost<S extends O = O> = {
  /** Content and border above the subject area. */
  readonly header: DevCtxEdge<S>;
  /** Content and border below the subject area. */
  readonly footer: DevCtxEdge<S>;
  /** Set the host foreground; null restores the default. */
  color(value: Color | null): DevCtxHost<S>;
  /** Set the host background color; null restores the default. */
  backgroundColor(value: Color | null): DevCtxHost<S>;
  /** Set the host background image; null removes it. */
  backgroundImage(value: t.DevBackgroundImageInput | t.StringUrl | null): DevCtxHost<S>;
  /** Set the subject guide color; zero hides the guides. */
  tracelineColor(value: Color | null): DevCtxHost<S>;
  /** Set the resolved CSS color inherited by host edges without an explicit border. */
  dividerColor(value: string): DevCtxHost<S>;
  /** Select a layer behind (negative) or in front of (positive) the subject; zero is reserved. */
  layer(index: number): DevCtxLayer<S>;
};

/**
 * Debug Panel
 */
export type DevCtxDebug<S extends O = O> = {
  row<T extends O = S>(input: t.DevRenderer<T> | t.JSXElement): t.DevRenderRef;
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
  render<T extends O = S>(input: t.DevRenderer<T> | t.JSXElement): DevCtxEdge<S>;
  border(color: Color | null): DevCtxEdge;
  padding(value: t.CssMarginInput | undefined | null): DevCtxEdge;
};

/**
 * A renderer targeting a specific layer.
 */
export type DevCtxLayer<S extends O = O> = {
  readonly index: number;
  render<T extends O = S>(input: t.DevRenderer<T> | t.JSXElement): DevCtxLayer<S>;
};
