/**
 * @module
 * Commonly used React types.
 */
import type { FC as ReactFC } from 'react';

type O = Record<string, unknown>;

/** The standard React function-component type. */
export type FC<P = {}> = ReactFC<P>;

/**
 * Helpers for working with `React.FC` (aka. "functional components").
 */
export declare namespace FC {
  /** Helpers for decorating React function components. */
  export type Lib = {
    /** Decorate a React function declaration with additional fields. */
    decorate<P, F extends O>(
      View: ReactFC<P>,
      fields: F,
      options?: { displayName?: string },
    ): ReactFC<P> & F;
  };
}
