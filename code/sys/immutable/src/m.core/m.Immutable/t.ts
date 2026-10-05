import type { t } from './common.ts';

type O = Record<string, unknown>;

export type * from './t.internal.ts';

/**
 * Type contracts for the core immutable module surface.
 */
export declare namespace ImmutableCore {
  /** Core immutable helper module surface. */
  export type Lib = {
    readonly Is: Is.Lib;
    asReadonly<T>(input: T): Readonly.As<T>;
    toObject<T extends O = O>(input?: T): ToObject.Unwrap<T>;
  };

  /**
   * Immutable Flags (type guards).
   */
  export namespace Is {
    /** Immutable predicate helper library. */
    export type Lib = {
      readonly objectPath: t.Is.Lib['objectPath'];
      proxy<T extends O>(input: any): input is T;

      immutable<D, P = unknown>(input: any): input is t.Immutable<D, P>;
      immutableRef<D, P = unknown, E = unknown>(input: any): input is t.ImmutableRef<D, P, E>;

      readonlyImmutable<T>(input: unknown): input is t.ImmutableReadonly<T>;
      readonlyImmutableRef<D, P = unknown, E = unknown>(
        input: unknown,
      ): input is t.ImmutableRefReadonly<D, P, E>;
    };
  }

  /**
   * Type contracts for `toObject`.
   */
  export namespace ToObject {
    /**
     * Type delegate for `toObject`.
     * Currently identity; reserved for detaching branded/proxy shapes in future.
     */
    export type Unwrap<T> = T;
  }

  /**
   * Readonly immutable conversion contracts.
   */
  export namespace Readonly {
    /**
     * Maps any immutable or ref handle (mutable or readonly)
     * into its canonical readonly reference shape.
     */
    export type As<T> =
      // Explicit matches first (precise transforms):
      T extends t.ImmutableRef<infer A, infer P, infer E> ? t.ImmutableRefReadonly<A, P, E>
        : T extends t.ImmutableRefReadonly<infer A, infer P, infer E>
          ? t.ImmutableRefReadonly<A, P, E>
        : T extends t.Immutable<infer A, infer P>
          ? t.ImmutableRefReadonly<A, P, t.ImmutableEvents<A, P>>
        : T extends t.ImmutableReadonly<infer A>
          ? t.ImmutableRefReadonly<A, unknown, t.ImmutableEvents<A, unknown>>
        : never;
  }
}
