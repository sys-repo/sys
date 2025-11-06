import type { t } from './common.ts';

export type * from './t.patch.ts';

type O = Record<string, unknown>;
type P = t.PatchOperation;
type DefaultPatch = P;

/**
 * Factory functions.
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

/**
 * Library: Immutable:
 */
export type ImmutableLib = {
  readonly Is: t.ImmutableIsLib;
  readonly Events: ImmutableEventsLib;
  readonly Patch: t.ImmutablePatchLib;
  readonly Lens: t.ImmutableLensLib;
  toObject<T extends O>(input?: any): T;
  cloner: Cloner;
  clonerRef: ClonerRef;
};

/**
 * Library: helpers for events.
 */
export type ImmutableEventsLib = {
  readonly viaOverride: EventsViaOverride;
  readonly viaObservable: EventsViaObservable;
  readonly pathFilter: PathEventsFactory;
};

/**
 * Library: Immutable Flags ("IS"):
 */
export type ImmutableIsLib = {
  readonly objectPath: t.StdIsLib['objectPath'];
  immutable<D, P = unknown>(input: any): input is t.Immutable<D, P>;
  immutableRef<D, P = unknown, E = unknown>(input: any): input is t.ImmutableRef<D, P, E>;
  proxy<T extends O>(input: any): input is T;
};
