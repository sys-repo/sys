import type { t } from './common.ts';

type O = Record<string, unknown>;
type P = t.PatchOperation;
type Cmd = { type: string; payload: { tx: string } };

/**
 * Simple/safe JSON/Patch driven Immutable<T> object
 * using Immer as the underlying immutability implementation.
 */
export type ImmerPatchStateLib = {
  /* Type validation helpers. */
  readonly Is: t.PatchStateIsLib;

  /* Tools for working with properties that act like an command/event stream. */
  readonly Command: t.PatchStateCommandLib;

  /**
   * Initialize a new `PatchState` Immutable<T> object.
   */
  create<T extends O, E = t.PatchStateEvents<T>>(
    initial: T,
    options?: {
      typename?: string;
      events?: t.PatchStateEventFactory<T, E>;
      onChange?: t.PatchChangeHandler<T>;
    },
  ): t.PatchState<T, E>;

  /**
   * Convert a draft (proxied instance) object into a simple object.
   * See: https://immerjs.github.io/immer/docs/original
   */
  toObject<T extends O>(input: any): T;
};

/**
 * Simple safe/immutable state wrapper for the data object.
 */
export type PatchState<T extends O, E = PatchStateEvents<T>> = t.ImmutableRef<T, P, E> & {
  readonly typename?: string;
};

/**
 * Event API
 *    Basic observable/disposable event provider firing
 *    the core stream of JSON-Patches emitted when the
 *    change(fn) method updates the current immutable state.
 */
export type PatchStateEvents<T extends O> = t.ImmutableEvents<T, P> & {
  readonly $: t.Observable<t.PatchChange<T>>;
};

/**
 * Injection factory for producing observable event objects
 * with a discreet lifetime.
 */
export type PatchStateEventFactory<T extends O, E> = (
  $: t.Observable<t.PatchChange<T>>,
  dispose$?: t.UntilObservable,
) => E;

/**
 * Library: Tools for working with properties that act like
 * an command/event stream.
 */
export type PatchStateCommandLib = {
  /**
   * Dispatches by changing the "cmd" (command) property on the
   * managed state object, and auto-clears it after release.
   *
   * NOTE:
   *    This prevents stale commands from being re-run if there
   *    is a UI event (such as a re-render) that causes the current
   *    command value to re-considered.
   */
  dispatcher<T extends Cmd>(
    state?: t.PatchState<{ cmd?: T }, any>,
    options?: { debounce?: t.Msecs },
  ): PatchDispatcher<T>;

  /**
   * Filter down on the "cmd" property observable.
   */
  filter<T extends Cmd>(
    $: t.Observable<t.PatchChange<{ cmd?: T }>>,
    dispose$?: t.UntilObservable,
  ): t.Observable<T>;
};

/* Function that dispatches a patch change. */
export type PatchDispatcher<T> = (cmd: T) => void;

/**
 * Type validation helpers.
 */
export type PatchStateIsLib = {
  /* Determine if the given object is a [PatchState] object. */
  state(input: unknown): input is t.PatchState<any>;

  /* Determine if the given object is a [PatchState] of the specified type. */
  type(input: unknown, typename: string): input is t.PatchState<any>;

  /**
   * Determine if the given object is a "proxy/draft" that is
   * currently being edited within a change function.
   */
  proxy(input: any): boolean;
};
