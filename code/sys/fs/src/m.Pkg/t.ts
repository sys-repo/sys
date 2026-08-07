import type { Pkg as StdPkg } from '@sys/std/t';
import type { t } from '../common.ts';

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

      /** Check a folder against its own distribution-package hash definitions. */
      checkSelfReported: CheckSelfReported.Method;

      /** Local-generation verification operations (non-authoritative local observation). */
      readonly Local: Local.Lib;

      /** Checksum-pinned distribution operations. */
      readonly Pinned: Pinned.Lib;

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
        /** Exact publisher-generated serialization evidence for `dist.json`. */
        manifest: Manifest;
        error?: t.StdError;
      };

      /**
       * Exact publisher-generated serialization evidence for `dist.json`.
       * Integrity becomes artifact authority only when distributed independently from artifact fetch.
       */
      export type Manifest = {
        /** SHA-256 of the exact serialized bytes produced by this computation. */
        readonly integrity: t.StringHash;
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
     * Self-reported distribution-package consistency contracts.
     */
    export namespace CheckSelfReported {
      /** Check a folder against its own distribution-package hash definitions. */
      export type Method = (
        dir: t.StringPath,
        hash?: t.Dir.Hash.Verify.Input,
      ) => Promise<Response>;

      /** Response from `Pkg.Dist.checkSelfReported`. */
      export type Response = {
        is: t.CompositeHash.Verify.Response['is'];
        exists: boolean;
        dist?: t.DistPkg;
        error?: t.StdError;
      };
    }

    /**
     * Shared verification contracts for checked distribution generations.
     */
    export namespace Verify {
      /** Shared verification method shape. */
      export type Method = (args: Args) => Promise<Result>;

      /** Shared verification arguments. */
      export type Args = {
        /** Generation directory. The root and every observed ancestor must be real directories. */
        dir: t.StringPath;
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

      /** Result of checked generation verification. Only `verified` is success. */
      export type Result = Verified | Failure;

      /** Successful verification with immutable owner-derived evidence. */
      export type Verified = {
        /** Successful verification with immutable owner-derived evidence. */
        readonly kind: 'verified';
        /** Verified artifacts, including integrity and immutable manifest+asset evidence. */
        readonly evidence: Evidence;
      };

      /** Immutable evidence produced by the verifier. */
      export type Evidence = {
        /** Canonical SHA-256 of the exact manifest bytes used by this verification. */
        readonly integrity: t.StringHash;
        /** Strictly admitted and deeply frozen manifest verified against the complete generation. */
        readonly dist: t.DeepReadonly<t.DistPkg>;
        /** Number of exact `dist.json` bytes observed. */
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
        /** Stable, non-authority failure classification. */
        readonly kind: FailureKind;
      };

      /**
       * Stable failure classification.
       *
       * - `invalid-input`: the caller input, limits, or lifecycle input is invalid.
       * - `missing`: the root or manifest is absent at its initial observation.
       * - `malformed`: manifest structure, policy, or self-report is invalid.
       * - `integrity-mismatch`: exact manifest bytes do not match the caller pin.
       * - `content-mismatch`: an initial stable root, manifest, or declared tree value is wrong.
       * - `unsafe-path`: root ancestry or admitted targets violate confinement or admission.
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

    /**
     * Local verification operation contracts.
     */
    export namespace Local {
      /** Local-generation verification operation library. */
      export type Lib = {
        /** Verify a generation with local manifest authority derived from observed bytes. */
        readonly verify: Verify.Method;
      };

      /**
       * Exact locally observed generation verification contracts.
       *
       * This variant has no caller-provided manifest integrity authority.
       */
      export namespace Verify {
        /** Verify one generation through exact local manifest observation. */
        export type Method = (args: Args) => Promise<Result>;

        /** Arguments passed to `Pkg.Dist.Local.verify`. */
        export type Args = Dist.Verify.Args;

        /** Required resource limits. */
        export type Limits = Dist.Verify.Limits;

        /** Result of local generation verification. */
        export type Result = Dist.Verify.Result;

        /** Successful verification with immutable evidence. */
        export type Verified = Dist.Verify.Verified;

        /** Immutable evidence produced by the verifier. */
        export type Evidence = Dist.Verify.Evidence;

        /** Failed verification without raw host errors, cancellation reasons, or local paths. */
        export type Failure = Dist.Verify.Failure;

        /** Stable local failure classification. */
        export type FailureKind = Dist.Verify.FailureKind;
      }
    }

    /**
     * Checksum-pinned distribution operations.
     */
    export namespace Pinned {
      /** Checksum-pinned distribution operation library. */
      export type Lib = {
        /** Verify a generation against an exact authenticated manifest. */
        readonly verify: Verify.Method;
        /** Read one exact checksum-pinned part from a distribution generation. */
        readonly readPart: ReadPart.Method;
      };

      /**
       * Exact pinned generation verification contracts.
       *
       * This variant is a compatibility path for pinned authority.
       */
      export namespace Verify {
        /** Verify one generation against an exact authenticated manifest. */
        export type Method = (args: Args) => Promise<Result>;

        /** Arguments passed to `Pkg.Dist.Pinned.verify`. */
        export type Args = Dist.Verify.Args & {
          /** Canonical SHA-256 of the exact `dist.json` bytes. */
          integrity: t.StringHash;
        };

        /** Required resource limits. */
        export type Limits = Dist.Verify.Limits;

        /** Result of pinned generation verification. */
        export type Result = Dist.Verify.Result;

        /** Successful verification with immutable owner-derived evidence. */
        export type Verified = Dist.Verify.Verified;

        /** Immutable evidence produced by the verifier. */
        export type Evidence = Dist.Verify.Evidence;

        /** Failed verification without raw host errors, cancellation reasons, or local paths. */
        export type Failure = Dist.Verify.Failure;

        /** Stable failure classification. */
        export type FailureKind = Dist.Verify.FailureKind;
      }

      /**
       * Exact checksum-pinned distribution part-read contracts.
       *
       * This operation authenticates one bounded file read against caller-supplied path, checksum,
       * and size authority, typically parsed from an authenticated `DistPkg.hash.parts` value. It
       * does not verify a complete generation or produce reusable evidence.
       */
      export namespace ReadPart {
        /** Read one exact checksum-pinned distribution part. */
        export type Method = (args: Args) => Promise<Result>;

        /** Arguments passed to `Pkg.Dist.Pinned.readPart`. */
        export type Args = {
          /** Generation directory. The root and every observed ancestor must be real directories. */
          dir: t.StringPath;
          /** Canonical Rooted-compatible root-relative part path. */
          path: t.StringPath;
          /** Canonical SHA-256 expected for the exact returned bytes. */
          checksum: t.StringHash;
          /** Exact expected byte length and allocation bound. */
          size: t.NumberBytes;
          /** Cancel when this lifecycle ends. Cancellation is checked at cooperative boundaries. */
          until?: t.UntilInput;
        };

        /** Result of a checksum-pinned part read. Only `read` is success. */
        export type Result = Read | Failure;

        /** Successful exact read whose bytes match the supplied checksum and size. */
        export type Read = {
          readonly kind: 'read';
          readonly bytes: Uint8Array;
        };

        /** Failed part read without raw host errors, cancellation reasons, or local paths. */
        export type Failure = {
          readonly kind: FailureKind;
        };

        /** Stable part-read failure classification. */
        export type FailureKind =
          | 'invalid-input'
          | 'missing'
          | 'content-mismatch'
          | 'unsafe-path'
          | 'symlink'
          | 'limit-exceeded'
          | 'changed'
          | 'unsupported'
          | 'io-failure'
          | 'cancelled';
      }
    }
  }
}
