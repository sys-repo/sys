import type { t } from './common.ts';

declare const TARGET: unique symbol;
declare const STAGE: unique symbol;

/**
 * Publish files and directories beneath one canonical root.
 *
 * Target paths are validated before use. File publication never overwrites an existing
 * target and allows at most one concurrent winner. Directory promotion leaves a target
 * found to exist untouched. Its race guarantee covers only writers that use the same
 * Rooted locking protocol. Shared and exclusive directory leases coordinate cooperating
 * processes through stable Rooted-owned lock identity outside each target. Sealing clears
 * write bits across an owned tree when the host can prove that mode state. Tree traversal
 * refuses symlinks, special entries, cross-device descendants, and multiply linked files.
 * Removal requires an exclusive lease and mutates only the covered target after confirming
 * filesystem identity.
 * An operation reports `unsupported` when required identity or permission evidence is unavailable.
 * If an operation fails, its error says whether filesystem reconciliation may be required.
 * These guarantees apply only to operations through this capability; Rooted is not an OS sandbox
 * or a boundary against a hostile process running as the same user.
 */
export declare namespace FsRooted {
  /** Runtime API for creating Rooted capabilities and checking their errors. */
  export type Lib = {
    /** Error checks. */
    readonly Is: IsLib;
    /** Create a capability bound to the selected root. */
    readonly create: (options: CreateOptions) => Promise<Instance>;
  };

  /** Checks for errors reported by Rooted. */
  export type IsLib = {
    /** Return true if the input is an error reported by a Rooted operation. */
    readonly failure: (input: unknown) => input is Failure;
  };

  /** Options for creating a Rooted capability. */
  export type CreateOptions = OperationOptions & {
    /** Directory that bounds the capability. Created if absent; its parent must exist. */
    readonly root: t.StringPath;
  };

  /** Options shared by Rooted operations. */
  export type OperationOptions = {
    /** Cancel the operation when this lifecycle ends. */
    readonly until?: t.UntilInput;
  };

  /** Rooted publisher bound to one canonical absolute directory. */
  export type Instance = {
    /** Canonical absolute root directory. */
    readonly path: t.StringAbsoluteDir;

    /** Validate all target paths together and return handles accepted only by this instance. */
    readonly admit: <K extends TargetKind>(
      targets: readonly TargetInput<K>[],
      options?: OperationOptions,
    ) => Promise<Admission<K>>;

    /**
     * Acquire one shared or exclusive OS-backed lease over admitted directory targets.
     *
     * Targets are acquired in stable lock-identity order regardless of caller order. By default,
     * contention returns `busy` without retaining a partial lease; `wait: true` waits until all
     * targets are acquired or cancellation/failure settles the operation. Unsupported locking and
     * other host failures reject with a typed Rooted failure after every partial lock is released.
     */
    readonly acquireLease: (
      targets: readonly Target<'directory'>[],
      options: LeaseOptions,
    ) => Promise<LeaseResult>;

    /** Inspect one complete tree, acquiring shared ownership or reusing a compatible lease. */
    readonly inspectSeal: (
      tree: OwnedTree,
      options?: OwnedTreeOptions,
    ) => Promise<SealInspection>;

    /** Seal one complete tree, acquiring exclusive ownership or reusing an exclusive lease. */
    readonly sealTree: (
      tree: OwnedTree,
      options?: OwnedTreeOptions,
    ) => Promise<SealResult>;

    /**
     * Remove an admitted directory target covered by an active exclusive lease.
     *
     * Missing targets return `absent`. Release waits for an in-flight removal before unlocking.
     * A failure after permission restoration or entry removal reports `committed: true`; callers
     * may reconcile the cause and retry with the same still-active lease. Success reports observed
     * absence, not persistence across sudden power loss.
     */
    readonly removeTree: (
      target: Target<'directory'>,
      options: RemoveTreeOptions,
    ) => Promise<RemoveTreeResult>;

    /**
     * Copy and sync `bytes`, then publish the complete file only if the target is absent.
     *
     * Readers see either no target or the complete file. A successful return does not
     * guarantee that the new directory entry survives sudden power loss. A failed operation
     * may leave a private temporary artifact when safe cleanup cannot be completed.
     */
    readonly publishFile: (
      target: Target<'file'>,
      bytes: Uint8Array,
      options?: OperationOptions,
    ) => Promise<FileResult>;

    /** Create an owned staging directory beneath the root. */
    readonly createStage: (options?: OperationOptions) => Promise<Stage>;

    /** Remove an active stage or retry cleanup after a previous promotion attempt. */
    readonly discardStage: (stage: Stage, options?: OperationOptions) => Promise<void>;

    /**
     * Publish an owned stage at an absent directory target.
     *
     * A target found to exist is left untouched. Races are coordinated only with writers
     * that use the same Rooted locking protocol. A successful return does not guarantee that
     * the renamed directory entry survives sudden power loss.
     */
    readonly promoteStage: (
      stage: Stage,
      target: Target<'directory'>,
      options?: PromotionOptions,
    ) => Promise<PromotionResult>;
  };

  /** Supported target kinds. */
  export type TargetKind = 'file' | 'directory';

  /** Root-relative target path supplied for validation. */
  export type TargetInput<K extends TargetKind = TargetKind> = {
    readonly kind: K;
    readonly path: t.StringPath;
  };

  /** Frozen target handle accepted only by the Rooted instance that created it. */
  export type Target<K extends TargetKind = TargetKind> = K extends TargetKind ? {
      readonly kind: K;
      readonly path: t.StringRelativePath;
      readonly [TARGET]: K;
    }
    : never;

  /** Frozen handles returned after the entire target batch passes validation. */
  export type Admission<K extends TargetKind = TargetKind> = {
    /** Handles in caller-supplied order. */
    readonly targets: readonly Target<K>[];
  };

  /** Advisory lock mode for one complete lease batch. */
  export type LeaseMode = 'shared' | 'exclusive';

  /** Required mode and optional contention/lifecycle policy; `until` never owns a returned lease. */
  export type LeaseOptions = OperationOptions & {
    readonly mode: LeaseMode;
    /** Wait for contended targets instead of returning `busy`; defaults to false. */
    readonly wait?: boolean;
  };

  /**
   * Held OS-backed ownership over admitted directory targets.
   *
   * Release is idempotent, waits for operations already borrowing the lease, and always attempts
   * to drop every held lock. The native async-disposal protocol enters the same release operation.
   * Lock files remain as stable Rooted metadata after
   * release and are never removed by the lease. They carry no PID or process-name authority; the OS
   * releases ownership when the holding process exits.
   */
  export type Lease = globalThis.AsyncDisposable & {
    readonly mode: LeaseMode;
    /** Handles in caller-supplied order. */
    readonly targets: readonly Target<'directory'>[];
    /** Explicitly release every held lock. */
    readonly release: () => Promise<void>;
    readonly [Symbol.dispose]?: never;
  };

  /** Acquisition result; `busy` is returned only by non-waiting contention. */
  export type LeaseResult =
    | { readonly kind: 'acquired'; readonly lease: Lease }
    | { readonly kind: 'busy'; readonly target: Target<'directory'> };

  /** An admitted directory target or active private stage accepted by sealing operations. */
  export type OwnedTree = Target<'directory'> | Stage;

  /** Optional compatible lease for a target; omission fails fast when this instance already holds one. */
  export type OwnedTreeOptions = OperationOptions & {
    /** Reuse active ownership instead of reacquiring the target lock. */
    readonly lease?: Lease;
  };

  /**
   * Observed sealing state for one complete owned tree.
   *
   * `sealed` means every entry has all write bits clear, every entry is owner-readable,
   * and every directory retains owner traversal permission.
   */
  export type SealInspection =
    | { readonly kind: 'sealed' }
    | { readonly kind: 'unsealed' }
    | { readonly kind: 'unsupported' };

  /** Verified write-bit seal evidence; it does not attest content bytes or provenance. */
  export type SealApplied = {
    readonly kind: 'applied';
    /** Whether this operation changed at least one entry. */
    readonly changed: boolean;
  };

  /** Sealing settlement; unsupported hosts never receive applied evidence. */
  export type SealResult = SealApplied | { readonly kind: 'unsupported' };

  /** Required exclusive ownership and optional cancellation for destructive removal. */
  export type RemoveTreeOptions = OperationOptions & {
    readonly lease: Lease;
  };

  /** Idempotent removal settlement for one admitted directory target. */
  export type RemoveTreeResult =
    | { readonly kind: 'removed' }
    | { readonly kind: 'absent' };

  /** Result of publishing a new complete file. */
  export type FileResult = {
    readonly kind: 'published';
    /** Number of bytes copied into the published file. */
    readonly bytes: t.NumberBytes;
  };

  /** Owned staging directory and a Rooted publisher for its contents. */
  export type Stage = {
    /** Canonical absolute path of the staged content before promotion. */
    readonly path: t.StringAbsoluteDir;
    /** Rooted publisher for files and nested stages within this stage. */
    readonly files: Instance;
    readonly [STAGE]: true;
  };

  /** Promotion options; sealing is opt-in, while an already sealed stage stays sealed. */
  export type PromotionOptions = OperationOptions & {
    /** Seal privately, make only the root movable, then reseal and verify after publication. */
    readonly seal?: boolean;
    /** Reuse active exclusive ownership instead of reacquiring the target lock. */
    readonly lease?: Lease;
  };

  /**
   * Whether the stage was published or the target already existed.
   *
   * `seal` is present when sealing was requested or the stage was already sealed, and the
   * published target was verified. `cleanupError` reports a cleanup, cancellation,
   * commit-boundary, or post-publication verification problem after the outcome
   * was known; neither field changes `kind`.
   */
  export type PromotionResult =
    | {
      readonly kind: 'published';
      readonly seal?: SealApplied;
      readonly cleanupError?: Failure;
    }
    | { readonly kind: 'occupied'; readonly cleanupError?: Failure };

  /** Operation identifiers reported by `Failure`. */
  export type Operation =
    | 'create'
    | 'admit'
    | 'acquire-lease'
    | 'release-lease'
    | 'inspect-seal'
    | 'seal-tree'
    | 'remove-tree'
    | 'publish-file'
    | 'create-stage'
    | 'discard-stage'
    | 'promote-stage';

  /** Stable failure codes reported by Rooted. */
  export type FailureKind =
    | 'cancelled'
    | 'invalid-root'
    | 'invalid-target'
    | 'invalid-lease'
    | 'invalid-options'
    | 'target-collision'
    | 'unsafe-filesystem'
    | 'foreign-handle'
    | 'invalid-state'
    | 'missing'
    | 'occupied'
    | 'ownership-lost'
    | 'permission-denied'
    | 'unsupported'
    | 'io-failure';

  /** Error reported by a Rooted operation. */
  export type Failure = Error & {
    readonly name: 'FsRootedError';
    /** Operation that failed. */
    readonly operation: Operation;
    /** Stable failure code. */
    readonly kind: FailureKind;
    /** Whether this operation may have changed filesystem state that requires reconciliation. */
    readonly committed: boolean;
  };
}
