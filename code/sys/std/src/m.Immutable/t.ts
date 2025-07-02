import type { t } from './common.ts';

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

/**
 * Library: helpers for working with RFC-6902 JSON patch standard.
 * https://tools.ietf.org/html/rfc6902
 */
export type ImmutablePatchLib = {
  /**
   * Convert an RFC-6901 JSON-Pointer (taken from a JSON-Patch operation or a raw
   * string) into an {@link t.ObjectPath}.
   *
   * Notes:
   *  • Root pointer (`''`) → `[]`
   *  • Lone slash (`'/'`)   → [''] (empty-property of root)
   *  • Decodes `~0` ⇢ `~`, `~1` ⇢ `/` (throws on invalid `~x`)
   *  • Numeric segments become **numbers** *only* when the token is exactly `0` | [1-9][0-9]* (no leading zeros, minus signs, or decimals)
   *  • `'-'` is preserved **only** when it is the *terminal* segment of the pointer (array-append sentinel). Else it is treated as a plain string.
   *  • Empty reference tokens between slashes ­­­(`'/foo//bar'`) are preserved as `''`.
   *
   * @example
   *    toPath('/foo/0/bar/42')            // ['foo', 0, 'bar', 42]
   *    toPath('/a~1b')                    // ['a/b']
   *    toPath('/c~0d')                    // ['c~d']
   *    toPath('/items/-')                 // ['items', '-']
   *    toPath('/')                        // ['']
   *    toPath('/foo//bar')                // ['foo', '', 'bar']
   */
  toObjectPath(path: string): t.ObjectPath;
};
