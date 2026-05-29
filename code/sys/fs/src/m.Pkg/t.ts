import type { Pkg as StdPkg } from '@sys/std/t';
import type { t } from './common.ts';

export type Pkg = StdPkg;

/**
 * Filesystem-extended package metadata helper contracts.
 */
export declare namespace Pkg {
  /** Filesystem-extended package metadata helper library. */
  export type Lib = StdPkg.Lib & {
    /** Tools for working with distribution packages on the filesystem. */
    readonly Dist: Dist.Lib;
  };

  /**
   * Distribution package filesystem contracts.
   */
  export namespace Dist {
    /** Filesystem helpers for distribution-package metadata. */
    export type Lib = StdPkg.Dist.Lib & {
      /** Load a `dist.json` file. */
      load: Load.Method;

      /** Compute distribution-package metadata. */
      compute: Compute.Method;

      /** Verify a folder against distribution-package hash definitions. */
      verify: Verify.Method;

      /** Logging helpers for distribution-package metadata. */
      readonly Log: Log.Lib;
    };

    /**
     * Distribution-package logging contracts.
     */
    export namespace Log {
      /** Logging helper library. */
      export type Lib = {
        /** Convert a `DistPkg` to a string for logging. */
        dist(dist?: t.DistPkg, options?: Options): string;

        /** Render child distribution packages for logging. */
        children(dir: t.StringDir, dist: t.DistPkg): Promise<string>;
      };

      /** Options for distribution-package log rendering. */
      export type Options = {
        title?: string | false;
        dir?: t.StringDir;
        indent?: number;
      };
    }

    /**
     * Distribution-package compute contracts.
     */
    export namespace Compute {
      /** Compute distribution-package metadata. */
      export type Method = (args: Args) => Promise<Response>;

      /** Arguments passed to `Pkg.Dist.compute`. */
      export type Args = {
        dir: t.StringPath;
        pkg?: StdPkg;
        builder?: StdPkg;
        ignore?: string | string[];
        save?: boolean;
        filter?(path: t.StringPath): boolean;
        onHashProgress?(e: t.Dir.Hash.Compute.ProgressEvent): t.Awaitable<void>;

        /**
         * Reuse child `dist.hash.parts` to avoid re-hashing nested bundles.
         *
         * Behavior:
         * - Child content hash parts are merged into the parent hash tree.
         * - Child `dist.json` file bytes are intentionally NOT included in the parent hash.
         *
         * Rationale:
         * - Keeps parent digest content-stable across rebuilds where only child metadata
         *   (for example `build.time`) changes.
         */
        trustChildDist?: boolean;
      };

      /** Response from `Pkg.Dist.compute`. */
      export type Response = {
        exists: boolean;
        dir: t.StringDir;
        dist: t.DistPkg;
        error?: t.StdError;
      };
    }

    /**
     * Distribution-package load contracts.
     */
    export namespace Load {
      /** Load a `dist.json` file. */
      export type Method = (dir: t.StringPath) => Promise<Response>;

      /** Classification of a loaded distribution-package file. */
      export type Kind = 'canonical' | 'legacy' | 'invalid' | 'missing';

      /** Response from `Pkg.Dist.load`. */
      export type Response = {
        exists: boolean;
        path: t.StringPath;
        kind: Kind;
        dist?: t.DistPkg;
        legacy?: t.DistPkgLegacy;
        error?: t.StdError;
      };
    }

    /**
     * Distribution-package verification contracts.
     */
    export namespace Verify {
      /** Verify a folder against distribution-package hash definitions. */
      export type Method = (
        dir: t.StringPath,
        hash?: t.Dir.Hash.Verify.Input,
      ) => Promise<Response>;

      /** Response from `Pkg.Dist.verify`. */
      export type Response = {
        is: t.HashVerifyResponse['is'];
        exists: boolean;
        dist?: t.DistPkg;
        error?: t.StdError;
      };
    }
  }
}
