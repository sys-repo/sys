import type { t } from './common.ts';

type O = Record<string, unknown>;
type P = t.PatchOperation;
type DefaultPatch = P;

export type * from './t.patch.ts';

/**
 * Library: Immutable (RFC6902 Patch Standard)
 */
export type ImmutableRfc6902Lib = {
  readonly Is: t.ImmutableIsLib;
  readonly Events: ImmutableRfc6902EventsLib;
  readonly Patch: t.ImmutableRfc6902PatchLib;
  readonly Lens: t.ImmutableLensLib;
  cloner: Cloner;
  clonerRef: ClonerRef;
  toObject<T extends O = O>(input?: T): t.UnwrapImmutable<T>;
};

/**
 * Helpers for RFC-6902 events.
 */
export type ImmutableRfc6902EventsLib = {
  readonly viaOverride: EventsViaOverride;
  readonly viaObservable: EventsViaObservable;
  readonly pathFilter: PathEventsFactory;
};

/**
 * Helpers: Factory functions.
 */
type ClonerOptions = { clone?: <C>(input: C) => C };
type Cloner = <T>(initial: T, options?: ClonerOptions) => t.Immutable<T, P>;
type ClonerRef = <T>(
  initial: T,
  options?: ClonerOptions,
) => t.ImmutableRef<T, P, t.ImmutableEvents<T, P>>;

type EventsViaOverride = <T, P = DefaultPatch>(
  source: t.Immutable<T, P>,
  dispose$?: t.UntilInput,
) => t.ImmutableEvents<T, P>;

type EventsViaObservable = <T, P = DefaultPatch>(
  $: t.Observable<t.ImmutableChange<T, P>>,
  dispose$?: t.UntilInput,
) => t.ImmutableEvents<T, P>;

type PathEventsFactory = <
  T,
  P = DefaultPatch,
  C extends t.ImmutableChange<T, P> = t.ImmutableChange<T, P>,
>(
  $: t.Observable<C>,
  toPath: (patch: P) => t.ObjectPath,
) => t.ImmutablePathEventsFactory<T, P, C>;
