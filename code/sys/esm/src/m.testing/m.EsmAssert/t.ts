import type { t } from './common.ts';

/**
 * Assertion helpers for testing `@sys/esm` boundaries and contracts.
 */
export declare namespace EsmAssert {
  /** Public assertion helper surface. */
  export type Lib = {
    readonly runtimeGraphBoundary: RuntimeGraph.Boundary;
  };

  /** Tools for asserting a runtime graph boundary. */
  export namespace RuntimeGraph {
    /** Assert that a runtime graph stays within its allowed boundary. */
    export type Boundary = (options: BoundaryOptions) => Promise<void>;

    export type BoundaryOptions = {
      readonly entry: t.StringPath;
      readonly forbiddenImports?: string[];
      readonly forbiddenPathIncludes?: string[];
    };
  }
}
