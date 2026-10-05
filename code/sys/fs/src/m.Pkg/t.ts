import type { Pkg as StdPkg } from '@sys/std/t';
import type { t } from '../common.ts';

export type Pkg = StdPkg;

/**
 * Package metadata and filesystem operations.
 */
export declare namespace Pkg {
  /** Package metadata with filesystem support. */
  export type Lib = StdPkg.Lib & {
    /** Tools for working with distribution packages on the filesystem. */
    readonly Dist: Dist.Lib;
  };

  /**
   * Distribution manifests, hashing, and verification.
   */
  export namespace Dist {
    /** Filesystem tools for distribution metadata and integrity. */
    export type Lib = StdPkg.Dist.Lib & {
      /** Load a `dist.json` file. */
      load: Load.Method;

      /** Compute a distribution manifest and content pin. */
      compute: Compute.Method;

      /** Copy selected source files into new, verified distributions. */
      project: Project.Method;

      /** Validate named pins and verify their local files. */
      readonly Pins: Pins.Lib;

      /** Check a local distribution from its own manifest and read checksum-matched files. */
      readonly Local: Local.Lib;

      /** Check against an independent content pin and read checksum-matched files. */
      readonly Pinned: Pinned.Lib;

      /** Bounded inventory accounting; does not admit paths or verify payload bytes. */
      readonly Inventory: Inventory.Lib;

      /** Logging helpers for distribution-package metadata. */
      readonly Log: Log.Lib;
    };

    /**
     * Inspect selected own enumerable data claims without I/O, sorting, hashing or authority.
     * Unselected keys are ignored; selected accessors and native proxies refuse without invocation.
     * UTF-16 full-path and repeated-prefix work are bounded independently before allocation.
     * Traversal spellings may inspect successfully; this does not establish path safety.
     */
    export namespace Inventory {
      export type Lib = { readonly inspect: Method };
      export type Method = (args: Args) => Result;
      export type Args = {
        /**
         * Nonempty plain or null-prototype dictionary of path → canonical SHA-256/size claims.
         * Values use `sha256-<64 lowercase hex>:size=<canonical nonnegative safe integer>`;
         * hash-only values refuse. Only own enumerable string keys count; symbols,
         * non-enumerable keys and inherited keys are ignored. Selected accessors and proxies refuse.
         */
        readonly parts: unknown;
        readonly limits: Limits;
      };
      /**
       * Own data bounds; unrelated limit members are ignored. Entries count one `dist.json`,
       * all payload files and distinct implied directories. Entries/path limits cannot raise
       * Content's fixed ceilings; omitted path limits use those ceilings. Entries/path bounds
       * must be positive safe integers; file/total byte bounds must be nonnegative safe integers.
       */
      export type Limits = Pick<
        Verify.Limits,
        'entries' | 'fileBytes' | 'totalBytes' | 'pathLength' | 'pathTotal'
      >;
      /** One owned file claim; its spelling has not passed Rooted target admission. */
      export type File = {
        readonly path: t.StringRelativePath;
        readonly hash: t.StringHash;
        readonly size: t.NumberBytes;
      };
      export type Result = Inspected | Failure;
      /** Newly owned frozen claims in enumeration order, not verified filesystem evidence. */
      export type Inspected = {
        readonly kind: 'inspected';
        readonly files: readonly File[];
        /** Sum of declared payload sizes; no manifest bytes are included or measured. */
        readonly totalBytes: t.NumberBytes;
        /** Sum of claims beneath `pkg/` or any nested `/pkg/` directory spelling. */
        readonly packageBytes: t.NumberBytes;
      };
      /** `unsafe-path` means ill-formed Unicode only; Rooted path policy is not applied here. */
      export type Failure = { readonly kind: FailureKind };
      export type FailureKind = Extract<
        Verify.FailureKind,
        'invalid-input' | 'malformed' | 'unsafe-path' | 'limit-exceeded'
      >;
    }

    /**
     * Limits for projection outputs or selected distributions.
     * Payload bytes count once per distribution; manifests are excluded.
     * `inventories` must be a positive safe integer; `totalBytes` a nonnegative safe integer.
     */
    export type BatchLimits = { inventories: number; totalBytes: number };

    /**
     * Copy selected files from one pinned distribution, preserving their bytes and relative paths.
     */
    export namespace Project {
      /**
       * Verify the source, write outputs in code-unit name order, then recheck the source.
       * Return pins only if every step succeeds. Completed outputs remain after a later failure.
       */
      export type Method = <N extends string>(args: Args<N>) => Promise<Result<N>>;

      /** Paths are relative to `root`. The root and output parents must already exist. */
      export type Args<N extends string> = {
        root: string;
        source: { dir: string; pin: t.DistPin };
        /** Nonempty name-to-directory map. Output directories must not already exist. */
        outputs: Record<N, string>;
        limits: Verify.Limits;
        batch: BatchLimits;
        /**
         * Select at least one source-relative payload path for each output name.
         * Return exactly the output names; exclude `dist.json` and duplicate paths within an output.
         */
        select: (content: t.DistContent) => Readonly<Record<N, readonly string[]>>;
        pkg?: StdPkg;
        builder?: StdPkg;
        until?: t.UntilInput;
      };

      /** All output pins on success, or a failure with no pins. */
      export type Result<N extends string> =
        | { readonly kind: 'projected'; readonly pins: Readonly<Record<N, t.DistPin>> }
        | Failure<N>;

      /** The failed step and any cleanup error, reported without paths or underlying exceptions. */
      export type Failure<N extends string> = {
        readonly kind: 'failed';
        readonly phase: 'input' | 'source' | 'select' | 'output' | 'recheck' | 'cleanup';
        readonly output?: N;
        readonly reason:
          | Verify.FailureKind
          | t.FsRooted.FailureKind
          | 'policy-failure'
          | 'compute-failure';
        /** Outputs this call may have left on disk, either published or still staged. */
        readonly remaining: readonly N[];
        /** First cleanup failure, when separate from `reason`. */
        readonly cleanup?: t.FsRooted.FailureKind;
      };
    }

    /**
     * Verify each named distribution against its independent content pin.
     */
    export namespace Pins {
      /** Named pin validation and local file verification. */
      export type Lib = StdPkg.Dist.Pins.Lib & { readonly verify: Verify };

      /** Copy inputs before asynchronous work; return evidence only if every distribution verifies. */
      export type Verify = <N extends string>(args: Args<N>) => Promise<Result<N>>;

      /** One root-relative directory for each pin, with exactly the same names. */
      export type Args<N extends string> = {
        root: string;
        selection: t.DistPins<N>;
        dirs: Record<N, string>;
        limits: Dist.Verify.Limits;
        batch: BatchLimits;
        until?: t.UntilInput;
      };

      /** Evidence for all distributions, or the first failure and its distribution name when known. */
      export type Result<N extends string> =
        | {
          readonly kind: 'verified';
          readonly evidence: Readonly<Record<N, Dist.Verify.Evidence>>;
        }
        | { readonly kind: Dist.Verify.FailureKind; readonly name?: N };
    }

    /**
     * Format distribution metadata for logging.
     */
    export namespace Log {
      /** Format one manifest or summarize child distributions. */
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
     * Generate a distribution manifest and content pin.
     *
     * Payload selection excludes `dist.json` and `dist.json.sig` at every depth in both modes.
     * Changes to root or child manifest metadata therefore do not change the content pin.
     */
    export namespace Compute {
      /** Hash selected payload files and optionally save the generated manifest. */
      export type Method = (args: Args) => Promise<Response>;

      /** Select payload files and supply descriptive package and builder labels. */
      export type Args = {
        dir: t.StringPath;
        pkg?: StdPkg;
        builder?: StdPkg;
        ignore?: string | string[];
        /** Write `dist.json` to `dir`. Defaults to `false`. */
        save?: boolean;
        filter?(path: t.StringPath): boolean;
        onHashProgress?(e: t.Dir.Hash.Compute.ProgressEvent): t.Awaitable<void>;

        /**
         * Reuse child manifests' recorded hashes and sizes without rereading their payload files.
         * Defaults to `false`.
         */
        trustChildDist?: boolean;
      };

      /** Successful computation or failure without a manifest or pin. */
      export type Response = Computed | Failed;

      /** Generated manifest with its content pin and exact-byte checksum. */
      export type Computed = {
        readonly kind: 'computed';
        readonly exists: true;
        readonly dir: t.StringDir;
        readonly dist: t.DistPkg;
        /** The same content identity as `dist.hash`, captured for independent recording. */
        readonly pin: t.DistPin;
        /**
         * SHA-256 of the generated `dist.json` bytes, whether saved or not.
         * Use it to detect byte changes, not as a content pin or to authenticate manifest metadata.
         */
        readonly manifestChecksum: t.StringHash;
        readonly error?: never;
      };

      /**
       * Failed computation with no returned manifest or pin.
       * A failed save does not guarantee rollback of filesystem changes.
       */
      export type Failed = {
        readonly kind: 'failed';
        readonly exists: boolean;
        readonly dir: t.StringDir;
        readonly error: t.StdError;
      };
    }

    /**
     * Read distribution manifests.
     */
    export namespace Load {
      /** Load a `dist.json` file. */
      export type Method = (dir: t.StringPath) => Promise<Response>;

      /** Classification of a loaded distribution-package file. */
      export type Kind = 'canonical' | 'invalid' | 'missing';

      /** Response from `Pkg.Dist.load`. */
      export type Response = {
        exists: boolean;
        path: t.StringPath;
        kind: Kind;
        /**
         * Parsed manifest with a checked inventory digest.
         * Payload files are not verified, and descriptive metadata is not authenticated.
         */
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

      /** Required finite resource limits; fixed protocol ceilings may be stricter. */
      export type Limits = {
        /** Maximum exact `dist.json` bytes; the implementation also caps this at 16 MiB. */
        manifestBytes: t.NumberBytes;
        /**
         * Maximum declared or observed descendants: files, directories, and `dist.json`.
         * Capped at `Pkg.Dist.Content.limits.entries`. Signature and ignore hints add no targets.
         */
        entries: t.NumberTotal;
        /** Maximum bytes in any one declared asset. */
        fileBytes: t.NumberBytes;
        /** Maximum aggregate declared asset bytes, excluding `dist.json`. */
        totalBytes: t.NumberBytes;
        /**
         * UTF-16 code units per path; defaults to `Pkg.Dist.Content.limits.pathLength` (4,096)
         * and cannot exceed it.
         */
        pathLength?: number;
        /**
         * Aggregate UTF-16 path code units, and separately all implied-directory prefix code units
         * (including repeated prefixes). Defaults to `Pkg.Dist.Content.limits.pathTotal`
         * (4,194,304 UTF-16 code units) and cannot exceed it.
         */
        pathTotal?: number;
      };

      /** Result of checking a complete distribution. Only `verified` is success. */
      export type Result = Verified | Failure;

      /** Successful verification with immutable evidence derived from observed bytes. */
      export type Verified = {
        readonly kind: 'verified';
        /** Verified inventory and byte totals; excludes descriptive manifest metadata. */
        readonly evidence: Evidence;
      };

      /** Immutable evidence produced by the verifier. */
      export type Evidence = {
        /** Verified file inventory and its content identity: scheme and digest. */
        readonly content: t.DistContent;
        /**
         * SHA-256 of the exact `dist.json` bytes read, for detecting changes to those bytes.
         * This is not a content pin and does not authenticate manifest metadata.
         */
        readonly manifestChecksum: t.StringHash;
        /** Number of exact `dist.json` bytes observed. */
        readonly manifestBytes: t.NumberBytes;
        /** Counts and byte totals derived from files read by the verifier. */
        readonly assets: {
          /** Number of verified declared files. */
          readonly files: t.NumberTotal;
          /** Aggregate bytes read from declared files. */
          readonly totalBytes: t.NumberBytes;
          /** Bytes in verified files beneath a directory named `pkg`, at any depth. */
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
       * - `malformed`: the content descriptor or its self-reported digest is invalid.
       * - `pin-mismatch`: recomputed content identity does not match the independent pin.
       * - `content-mismatch`: the root, manifest, or a declared entry has unexpected content.
       * - `unsafe-path`: the selected root, ancestry, or target fails required path checks.
       * - `symlink`: a symbolic link appeared where a real directory or file was required.
       * - `unexpected-entry`: the tree contains an undeclared or special entry.
       * - `limit-exceeded`: the operation would exceed a caller bound or protocol ceiling.
       * - `changed`: the tree changed while it was being checked.
       * - `unsupported`: the host cannot provide the filesystem evidence required for safety.
       * - `io-failure`: another host filesystem operation failed.
       * - `cancelled`: cancellation was observed at a cooperative boundary.
       */
      export type FailureKind =
        | 'invalid-input'
        | 'missing'
        | 'malformed'
        | 'pin-mismatch'
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
     * Check local file consistency without an independent content pin.
     *
     * `verify` checks the complete tree against its own manifest; it does not establish provenance.
     * `readPart` checks one file against the caller's checksum and size without reading the manifest.
     *
     * Each call captures `dir` synchronously and resolves it independently. Neither operation
     * guarantees a stable filesystem location against hostile path replacement.
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
        export type FailureKind = Exclude<Dist.Verify.FailureKind, 'pin-mismatch'>;
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
     * Check distributions against an independent content pin, or read checksum-matched files.
     *
     * `admitManifest` checks a supplied manifest's inventory against the pin; `verify` also checks
     * the complete filesystem tree. The pin records the scheme/digest chosen elsewhere, never
     * discovered from the candidate manifest. `readPart` instead checks caller-supplied file
     * expectations without reading a manifest or accepting a content pin.
     *
     * Filesystem checks do not guarantee a stable location against hostile path replacement.
     */
    export namespace Pinned {
      /** Pinned distribution operations. */
      export type Lib = {
        /** Bound and parse manifest bytes, then recompute the inventory against a content pin. */
        readonly admitManifest: AdmitManifest.Method;
        /** Verify a complete distribution against an independent content pin. */
        readonly verify: Verify.Method;
        /** Read one file only when its path, size, and checksum match. */
        readonly readPart: ReadPart.Method;
      };

      /**
       * Strict inventory admission against a caller-supplied content pin.
       *
       * Performs no filesystem or network I/O.
       * Admission does not verify assets or establish provenance.
       */
      export namespace AdmitManifest {
        /** Admit manifest inventory against the caller's independently supplied pin. */
        export type Method = (args: Args) => Promise<Result>;

        /** Bytes, pin, and limits are snapshotted before lifecycle callbacks or awaits. */
        export type Args = {
          /** Exact manifest bytes; shared or detached buffers are rejected. */
          bytes: Uint8Array;
          /** Independent supported scheme and expected canonical content digest. */
          pin: t.DistPin;
          /** Required bounds on manifest bytes and declared assets. */
          limits: Limits;
          /** Cancellation observed at cooperative checkpoints. */
          until?: t.UntilInput;
        };

        /** Finite limits on manifest bytes and the declared asset tree. */
        export type Limits = Omit<Dist.Verify.Limits, 'entries'> & {
          /**
           * Maximum entries: `dist.json`, declared assets, and distinct implied directories.
           * Excluded metadata cannot expand the admitted tree.
           */
          entries: t.NumberTotal;
        };

        /** Manifest admission or refusal. */
        export type Result = Admitted | Failure;

        /** Pin-matched inventory; payload bytes and excluded metadata are not authenticated here. */
        export type Admitted = {
          readonly kind: 'manifest-admitted';
          readonly evidence: Evidence;
        };

        /** Immutable evidence from the manifest bytes alone. */
        export type Evidence = {
          /** Pin-matched file inventory and its scheme/digest; payload bytes are not checked. */
          readonly content: t.DistContent;
          /**
           * SHA-256 of the exact supplied manifest bytes, for detecting changes to those bytes.
           * This is not a content pin and does not authenticate manifest metadata.
           */
          readonly manifestChecksum: t.StringHash;
          /** Manifest byte count, including any BOM and whitespace. */
          readonly manifestBytes: t.NumberBytes;
        };

        /** Refusal without input values, cancellation reasons, or host errors. */
        export type Failure = { readonly kind: FailureKind };

        /** The verifier's failure categories that apply to manifest admission. */
        export type FailureKind = Extract<
          Dist.Verify.FailureKind,
          | 'invalid-input'
          | 'pin-mismatch'
          | 'malformed'
          | 'unsafe-path'
          | 'limit-exceeded'
          | 'cancelled'
        >;
      }

      /**
       * Verification of a complete distribution against an independent content pin.
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
          /** Independent supported scheme and expected canonical content digest. */
          pin: t.DistPin;
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
       * Does not read a manifest, accept a content pin, or check inventory membership.
       * It neither verifies the complete distribution nor returns reusable verification evidence.
       */
      export namespace ReadPart {
        /** Read one file matching the caller's checksum and size. */
        export type Method = (args: Args) => Promise<Result>;

        /** Arguments passed to `Pkg.Dist.Pinned.readPart`. */
        export type Args = {
          /**
           * Distribution directory whose root and observed ancestors must be real directories.
           * Relative spelling resolves synchronously against the process CWD at invocation.
           */
          dir: t.StringPath;
          /** File path relative to `dir`; must already satisfy Rooted's `Target.admit` path rules. */
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
