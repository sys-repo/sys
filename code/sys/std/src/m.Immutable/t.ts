import type { t } from './common.ts';

type O = Record<string, unknown>;
type P = t.PatchOperation;

export type ImmutableMapPatchDefault = t.ImmutableMapPatch<t.PatchOperation>;

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
 * An private/internal API for operating on the map
 * that is not part of the main public interface.
 */
export type ImmutableMapInternal<T extends O, P> = {
  readonly mapping: t.ImmutableMapping<T, P>;
  origin(key: string | symbol): t.ImmutableMappingProp<T, P> | undefined;
};

/**
 * Library: Immutable
 */
export type ImmutableLib = {
  readonly Is: t.ImmutableIsLib;
  readonly Map: t.ImmutableMapLib;
  readonly events: { viaOverride: EventsViaOverride; viaObservable: EventsViaObservable };
  toObject<T extends O>(input?: any): T;
  map: t.ImmutableMapLib['create'];
  cloner: Cloner;
  clonerRef: ClonerRef;
};

/**
 * Library: Immutable Map
 */
export type ImmutableMapLib = {
  toObject<T extends O>(input?: any): T;
  create<T extends O, P = t.ImmutableMapPatchDefault>(
    mapping: t.ImmutableMapping<T, P>,
    options?: { formatPatch?: t.ImmutableMapFormatPatch<P> },
  ): t.ImmutableMap<T, P>;
  internal<T extends O, P>(
    input: t.ImmutableRef<T, P> | t.ImmutableMap<T, P>,
  ): t.ImmutableMapInternal<T, P> | undefined;
};

/**
 * Library: Immutable Flabs ("IS")
 */
export type ImmutableIsLib = {
  immutable<D, P = unknown>(input: any): input is t.Immutable<D, P>;
  immutableRef<D, P = unknown, E = unknown>(input: any): input is t.ImmutableRef<D, P, E>;
  map<T extends O, P = unknown>(input: any): input is t.ImmutableMap<T, P>;
  proxy<T extends O>(input: any): input is T;
};
