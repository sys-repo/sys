import type { t } from './common.ts';

type O = Record<string, unknown>;
type P = t.Rfc6902PatchOperation;
type DefaultPatch = P;

/**
 * Library: Immutable (RFC6902 Patch Standard)
 */
export declare namespace ImmutableRfc6902 {
  /** RFC-6902 immutable helper module surface. */
  export type Lib = {
    readonly Is: t.ImmutableCore.Is.Lib;
    readonly Events: Events.Lib;
    readonly Patch: Patch.Lib;
    readonly Lens: t.ImmutableLens.Lib;
    cloner: Cloner;
    clonerRef: ClonerRef;
    asReadonly<T>(input: T): t.ImmutableCore.Readonly.As<T>;
    toObject<T extends O = O>(input?: T): t.ImmutableCore.ToObject.Unwrap<T>;
  };

  /** Helpers for RFC-6902 events. */
  export namespace Events {
    export type Lib = {
      readonly viaOverride: EventsViaOverride;
      readonly viaObservable: EventsViaObservable;
      readonly pathFilter: PathEventsFactory;
    };
  }

  /** Helpers for working with RFC-6902 JSON patch pointers. */
  export namespace Patch {
    export type Lib = {
      /** Convert an RFC-6901 JSON-Pointer into an object path. */
      toObjectPath(path: string): t.ObjectPath;
    };
  }
}

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
  until?: t.UntilInput,
) => t.ImmutableEvents<T, P>;

type EventsViaObservable = <T, P = DefaultPatch>(
  $: t.Observable<t.ImmutableChange<T, P>>,
  until?: t.UntilInput,
) => t.ImmutableEvents<T, P>;

type PathEventsFactory = <
  T,
  P = DefaultPatch,
  C extends t.ImmutableChange<T, P> = t.ImmutableChange<T, P>,
>(
  $: t.Observable<C>,
  toPath: (patch: P) => t.ObjectPath,
) => t.ImmutablePathEventsFactory<T, P, C>;
