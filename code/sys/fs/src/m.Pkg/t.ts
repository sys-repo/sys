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
   * Distribution metadata and integrity contracts.
   */
  export namespace Dist {
    /** Filesystem tools for distribution metadata and integrity. */
    export type Lib = StdPkg.Dist.Lib & {
      /** Load a `dist.json` file. */
      load: Load.Method;

      /** Compute distribution-package metadata. */
      compute: Compute.Method;

      /** Check a directory against the checksum claims in its own manifest. */
      checkSelfReported: CheckSelfReported.Method;

      /** Check a local distribution from its own manifest and read checksum-matched files. */
      readonly Local: Local.Lib;

      /** Check against an external manifest checksum and read checksum-matched files. */
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
        /** Checksum for the exact `dist.json` bytes produced by this computation. */
        manifest: Manifest;
        error?: t.StdError;
      };

      /**
       * Checksum of the exact `dist.json` bytes produced by the publisher.
       *
       * This checksum identifies an artifact only when obtained independently of the artifact itself.
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
     * Verification contracts shared by local and pinned distributions.
     */
    export namespace Verify {
      /** Verify a complete distribution. */
      export type Method = (args: Args) => Promise<Result>;

      /** Inputs shared by local and pinned verification. */
      export type Args = {
        /**
         * Directory containing `dist.json` and the files it names.
         * Relative spelling resolves synchronously against the process CWD at invocation.
         */
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

      /** Result of checking a complete distribution. Only `verified` is success. */
      export type Result = Verified | Failure;

      /** Successful verification with immutable evidence derived from observed bytes. */
      export type Verified = {
        /** Verification succeeded. */
        readonly kind: 'verified';
        /** Integrity, manifest, and asset totals derived from the verified bytes. */
        readonly evidence: Evidence;
      };

      /** Immutable evidence produced by the verifier. */
      export type Evidence = {
        /** Canonical SHA-256 of the exact manifest bytes used by this verification. */
        readonly integrity: t.StringHash;
        /** Manifest checked against the complete distribution tree. */
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
        /** Stable failure category. */
        readonly kind: FailureKind;
      };

      /**
       * Stable failure categories.
       *
       * - `invalid-input`: the caller input, limits, or lifecycle input is invalid.
       * - `missing`: the root or manifest was not found.
       * - `malformed`: the manifest structure, policy, or self-report is invalid.
       * - `integrity-mismatch`: the manifest bytes do not match the caller's pin.
       * - `content-mismatch`: the root, manifest, or a declared entry has unexpected content.
       * - `unsafe-path`: the selected root, ancestry, or target fails required path checks.
       * - `symlink`: a symbolic link appeared where a real directory or file was required.
       * - `unexpected-entry`: the tree contains an undeclared or special entry.
       * - `limit-exceeded`: the operation would exceed a caller-supplied bound.
       * - `changed`: the tree changed while it was being checked.
       * - `unsupported`: the host cannot provide the filesystem evidence required for safety.
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
     * Verify and read a distribution using the manifest found in its directory.
     *
     * Local verification derives the manifest checksum from the bytes it reads; the caller does not
     * supply an expected checksum. Each call captures `dir` synchronously and resolves it
     * independently. These operations authenticate observed bytes, not filesystem location against
     * hostile path replacement.
     */
    export namespace Local {
      /** Local distribution operations. */
      export type Lib = {
        /** Verify the manifest and the complete tree it describes. */
        readonly verify: Verify.Method;
        /** Read one file only when its path, size, and checksum match. */
        readonly readPart: ReadPart.Method;
      };

      /**
       * Verification of a complete distribution using the manifest found at its root.
       */
      export namespace Verify {
        /** Verify one local distribution. */
        export type Method = (args: Args) => Promise<Result>;

        /** Arguments passed to `Pkg.Dist.Local.verify`. */
        export type Args = Omit<Dist.Verify.Args, 'dir'> & {
          /** Directory captured at invocation whose path must match the host's canonical path. */
          dir: t.StringPath;
        };

        /** Required resource limits. */
        export type Limits = Dist.Verify.Limits;

        /** Result of local distribution verification. Only `verified` is success. */
        export type Result = Verified | Failure;

        /** Successful verification with immutable evidence. */
        export type Verified = Dist.Verify.Verified;

        /** Immutable evidence produced by the verifier. */
        export type Evidence = Dist.Verify.Evidence;

        /** Failed verification without raw host errors, cancellation reasons, or local paths. */
        export type Failure = { readonly kind: FailureKind };

        /** Stable local failure category. Local verification has no caller pin to mismatch. */
        export type FailureKind = Exclude<Dist.Verify.FailureKind, 'integrity-mismatch'>;
      }

      /**
       * Checksum-matched file reads using a root canonicalized for each call.
       */
      export namespace ReadPart {
        /** Read one checksum-matched file from a local distribution. */
        export type Method = (args: Args) => Promise<Result>;
        /** Selected root, expected file properties, and optional cancellation. */
        export type Args = Omit<Pinned.ReadPart.Args, 'dir'> & {
          /** Directory captured at invocation whose path must match the host's canonical path. */
          dir: t.StringPath;
        };
        /** Successful read or failure. */
        export type Result = Pinned.ReadPart.Result;
        /** Successful checksum-matched read. */
        export type Read = Pinned.ReadPart.Read;
        /** Failed read without sensitive host details. */
        export type Failure = Pinned.ReadPart.Failure;
        /** Stable local read failure category. */
        export type FailureKind = Pinned.ReadPart.FailureKind;
      }
    }

    /**
     * Verify and read a distribution against an expected manifest checksum.
     *
     * The caller obtains that checksum elsewhere, connecting local bytes to an independently chosen
     * distribution identity.
     */
    export namespace Pinned {
      /** Pinned distribution operations. */
      export type Lib = {
        /** Verify a complete distribution against an expected manifest checksum. */
        readonly verify: Verify.Method;
        /** Read one file only when its path, size, and checksum match. */
        readonly readPart: ReadPart.Method;
      };

      /**
       * Verification of a complete distribution against an expected manifest checksum.
       */
      export namespace Verify {
        /** Verify one pinned distribution. */
        export type Method = (args: Args) => Promise<Result>;

        /** Arguments passed to `Pkg.Dist.Pinned.verify`. */
        export type Args = Omit<Dist.Verify.Args, 'dir'> & {
          /**
           * Distribution directory whose root and observed ancestors must be real directories.
           * Relative spelling resolves synchronously against the process CWD at invocation.
           */
          dir: t.StringPath;
          /** Canonical SHA-256 of the exact `dist.json` bytes. */
          integrity: t.StringHash;
        };

        /** Required resource limits. */
        export type Limits = Dist.Verify.Limits;

        /** Result of pinned distribution verification. */
        export type Result = Dist.Verify.Result;

        /** Successful verification with immutable evidence. */
        export type Verified = Dist.Verify.Verified;

        /** Immutable evidence produced by the verifier. */
        export type Evidence = Dist.Verify.Evidence;

        /** Failed verification without raw host errors, cancellation reasons, or local paths. */
        export type Failure = Dist.Verify.Failure;

        /** Stable failure category. */
        export type FailureKind = Dist.Verify.FailureKind;
      }

      /**
       * One-file reads checked against a caller-supplied path, checksum, and size.
       *
       * This operation does not verify the complete distribution or return reusable verification
       * evidence.
       */
      export namespace ReadPart {
        /** Read one checksum-matched file from a pinned distribution. */
        export type Method = (args: Args) => Promise<Result>;

        /** Arguments passed to `Pkg.Dist.Pinned.readPart`. */
        export type Args = {
          /**
           * Distribution directory whose root and observed ancestors must be real directories.
           * Relative spelling resolves synchronously against the process CWD at invocation.
           */
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

        /** Result of a checksum-matched read. Only `read` is success. */
        export type Result = Read | Failure;

        /** Successful read whose bytes match the supplied checksum and size. */
        export type Read = {
          readonly kind: 'read';
          readonly bytes: Uint8Array;
        };

        /** Failed read without raw host errors, cancellation reasons, or local paths. */
        export type Failure = { readonly kind: FailureKind };

        /** Stable read failure category. */
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
