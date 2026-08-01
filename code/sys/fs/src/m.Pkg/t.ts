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

      /** Verify a generation against an exact authenticated manifest. */
      readonly verifyPinned: VerifyPinned.Method;

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
        is: t.CompositeHash.Verify.Response['is'];
        exists: boolean;
        dist?: t.DistPkg;
        error?: t.StdError;
      };
    }

    /**
     * Exact pinned generation verification contracts.
     *
     * Verification authenticates the exact `dist.json` bytes before parsing, checks every declared
     * asset through opened file handles, rejects undeclared tree entries, and compares filesystem
     * identity and metadata across repeated observations. Hash-policy and signature descriptors are
     * authenticated metadata only: they do not load code or establish signature trust, and a
     * signature sidecar must not be present in the verified tree. To bound synchronous ignore
     * matching, each admitted ignore rule may contain at most one `**` path segment and at most one
     * unescaped `*` wildcard in every other path segment.
     *
     * Security position: success attests only the stable observations completed by this call. Deno
     * exposes no portable directory-relative, no-follow open (`openat`/`O_NOFOLLOW`), so a process
     * with the same filesystem authority can race path replacement. This is acceptable only for
     * published generations treated as immutable: observed changes fail closed; hostile-writer
     * resistance requires a stronger native backend.
     */
    export namespace VerifyPinned {
      /** Verify one generation against an exact authenticated manifest. */
      export type Method = (args: Args) => Promise<Result>;

      /** Arguments passed to `Pkg.Dist.verifyPinned`. */
      export type Args = {
        /** Generation directory. The root and every observed ancestor must be real directories. */
        dir: t.StringPath;
        /** Canonical SHA-256 of the exact `dist.json` bytes. */
        integrity: t.StringHash;
        /** Required upper bounds applied before allocation or traversal can exceed them. */
        limits: Limits;
        /** Cancel when this lifecycle ends. Cancellation is checked at cooperative boundaries. */
        until?: t.UntilInput;
      };

      /** Required resource limits. No unlimited defaults are applied. */
      export type Limits = {
        /** Maximum exact `dist.json` bytes. */
        manifestBytes: t.NumberBytes;
        /** Maximum observed descendants, including files, directories, and `dist.json`. */
        entries: t.NumberTotal;
        /** Maximum bytes in any one declared asset. */
        fileBytes: t.NumberBytes;
        /** Maximum aggregate declared asset bytes, excluding `dist.json`. */
        totalBytes: t.NumberBytes;
      };

      /** Result of pinned generation verification. Only `verified` is success. */
      export type Result = Verified | Failure;

      /** Successful verification with immutable owner-derived evidence. */
      export type Verified = {
        readonly kind: 'verified';
        readonly evidence: Evidence;
      };

      /** Immutable evidence produced by the verifier. */
      export type Evidence = {
        /** Exact caller pin matched by both manifest reads. */
        readonly integrity: t.StringHash;
        /** Authenticated, strictly admitted, and deeply frozen manifest value. */
        readonly dist: t.DeepReadonly<t.DistPkg>;
        /** Number of authenticated `dist.json` bytes. */
        readonly manifestBytes: t.NumberBytes;
        /** Counts and byte totals derived from files read by the verifier. */
        readonly assets: {
          /** Number of verified declared files. */
          readonly files: t.NumberTotal;
          /** Aggregate bytes read from declared files. */
          readonly totalBytes: t.NumberBytes;
          /** Bytes whose admitted paths satisfy the Dist package-code policy. */
          readonly packageBytes: t.NumberBytes;
        };
      };

      /** Failed verification without raw host errors, cancellation reasons, or local paths. */
      export type Failure = {
        readonly kind: FailureKind;
      };

      /**
       * Stable failure classification.
       *
       * - `invalid-input`: the caller pin, limits, or lifecycle input is invalid.
       * - `missing`: the root or manifest is absent at its initial observation.
       * - `malformed`: authenticated manifest structure, policy, or self-report is invalid.
       * - `integrity-mismatch`: exact manifest bytes do not match the caller pin.
       * - `content-mismatch`: an initial stable root, manifest, or declared tree value is wrong.
       * - `unsafe-path`: root ancestry or authenticated targets violate confinement or admission.
       * - `symlink`: an initially checked root, ancestor, directory, or file path is a symlink.
       * - `unexpected-entry`: the stable tree contains an undeclared or special entry.
       * - `limit-exceeded`: caller-owned work or allocation bounds would be exceeded.
       * - `changed`: identity, metadata, kind, presence, or bytes changed between observations.
       * - `unsupported`: required filesystem semantics or trustworthy metadata are unavailable.
       * - `io-failure`: another host filesystem operation failed.
       * - `cancelled`: cancellation was observed at a cooperative boundary.
       */
      export type FailureKind =
        | 'invalid-input'
        | 'missing'
        | 'malformed'
        | 'integrity-mismatch'
        | 'content-mismatch'
        | 'unsafe-path'
        | 'symlink'
        | 'unexpected-entry'
        | 'limit-exceeded'
        | 'changed'
        | 'unsupported'
        | 'io-failure'
        | 'cancelled';
    }
  }
}
