import type { t } from './common.ts';

declare const TARGET: unique symbol;
declare const STAGE: unique symbol;

/**
 * Publish files and directories beneath one canonical root.
 *
 * Target paths are validated before use. File publication never overwrites an existing
 * target and allows at most one concurrent winner. Directory promotion leaves a target
 * found to exist untouched. Its race guarantee covers only writers that use the same
 * Rooted locking protocol. Cleanup removes an artifact only after confirming its
 * filesystem identity. An operation reports `unsupported` when required stable identity
 * evidence is unavailable or cannot be represented safely. If an operation fails, its
 * error says whether the target had already been published. These guarantees apply only
 * to operations through this capability; Rooted is not an OS sandbox.
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
      options?: OperationOptions,
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

  /**
   * Whether the stage was published or the target already existed.
   *
   * `cleanupError` reports a cleanup or cancellation problem found after the outcome was
   * known; it does not change `kind`.
   */
  export type PromotionResult =
    | { readonly kind: 'published'; readonly cleanupError?: Failure }
    | { readonly kind: 'occupied'; readonly cleanupError?: Failure };

  /** Operation identifiers reported by `Failure`. */
  export type Operation =
    | 'create'
    | 'admit'
    | 'publish-file'
    | 'create-stage'
    | 'discard-stage'
    | 'promote-stage';

  /** Stable failure codes reported by Rooted. */
  export type FailureKind =
    | 'cancelled'
    | 'invalid-root'
    | 'invalid-target'
    | 'target-collision'
    | 'unsafe-filesystem'
    | 'foreign-handle'
    | 'invalid-state'
    | 'occupied'
    | 'ownership-lost'
    | 'unsupported'
    | 'io-failure';

  /** Error reported by a Rooted operation. */
  export type Failure = Error & {
    readonly name: 'FsRootedError';
    /** Operation that failed. */
    readonly operation: Operation;
    /** Stable failure code. */
    readonly kind: FailureKind;
    /** Whether this operation's file or stage was already visible before the failure. */
    readonly committed: boolean;
  };
}
