import type { t } from './common.ts';

type O = Record<string, unknown>;
type P = t.PatchOperation;

/**
 * Factory functions.
 */
type ClonerOptions = { clone?: <C>(input: C) => C };
type Cloner = <T>(initial: T, options?: ClonerOptions) => t.Immutable<T, P>;
type ClonerRef = <T>(
  initial: T,
  options?: ClonerOptions,
) => t.ImmutableRef<T, P, t.ImmutableEvents<T, P>>;

type EventsViaOverride = <T, P = t.PatchOperation>(
  source: t.Immutable<T, P>,
  dispose$?: t.UntilInput,
) => t.ImmutableEvents<T, P>;

type EventsViaObservable = <T, P = t.PatchOperation>(
  $: t.Observable<t.ImmutableChange<T, P>>,
  dispose$?: t.UntilInput,
) => t.ImmutableEvents<T, P>;

/**
 * Library: Immutable:
 */
export type ImmutableLib = {
  readonly Is: t.ImmutableIsLib;
  readonly events: { viaOverride: EventsViaOverride; viaObservable: EventsViaObservable };
  toObject<T extends O>(input?: any): T;
  cloner: Cloner;
  clonerRef: ClonerRef;
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
