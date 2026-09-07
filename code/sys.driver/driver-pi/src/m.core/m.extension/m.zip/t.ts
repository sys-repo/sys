import type { t } from './common.ts';

/**
 * Wrapper-owned bounded ZIP inspection Pi extension.
 */
export declare namespace PiZipExtension {
  /**
   * Runtime surface for bounded read-only ZIP tools.
   */
  export type Lib = {
    /**
     * Resolve immutable extension policy from launcher read/protected roots.
     */
    resolvePolicy(input: ResolvePolicyInput): Promise<Policy>;
    /**
     * Tool names registered by enabled ZIP policy.
     */
    toolNames(policy: Policy): readonly ToolName[];
    /**
     * Convert enabled ZIP policy to Pi prompt args.
     */
    toPromptArgs(policy: Policy): readonly string[];
    /**
     * Materialize the generated read-only ZIP extension.
     */
    write(input: WriteInput): Promise<WriteResult>;
  };

  /** Read-only ZIP tool name. */
  export type ToolName = 'zip_inspect' | 'zip_test';

  /** Safe device/inode identity available from the host. */
  export type Identity = { readonly dev: number; readonly ino: number };

  /** Lexical and canonical launch-time evidence for one policy root. */
  export type RootEvidence = {
    readonly path: t.StringPath;
    readonly foldedNfc: string;
    readonly foldedNfd: string;
    readonly real?: t.StringPath;
    readonly realFoldedNfc?: string;
    readonly realFoldedNfd?: string;
    readonly identity?: Identity;
  };

  /** Frozen generated-runtime policy. */
  export type Policy = {
    readonly version: 1;
    readonly enabled: boolean;
    readonly readRoots: readonly RootEvidence[];
    readonly protectedRoots: readonly RootEvidence[];
    readonly protectedNames: readonly ['.git', '.pi', '.sys.rooted'];
    readonly operationTimeoutMs: 120_000;
    readonly maxArgumentChars: 4_096;
    readonly maxDisplayChars: 60_000;
    readonly maxErrorChars: 16_000;
    readonly snapshotMaxBytes: 67_108_864;
    readonly zipLimits: {
      readonly maxSourceBytes: 67_108_864;
      readonly maxEntries: 2_048;
      readonly maxTreeEntries: 8_192;
      readonly maxPathBytes: 512;
      readonly maxPathDepth: 32;
      readonly maxEntryBytes: 134_217_728;
      readonly maxExpandedBytes: 536_870_912;
      readonly maxErrorChars: 16_000;
    };
  };

  /** Inputs for resolving ZIP extension policy. */
  export type ResolvePolicyInput = {
    enabled?: boolean;
    readRoots: t.StringPath[];
    protectedRoots: t.StringPath[];
  };

  /** Materialization request. */
  export type WriteInput = {
    cwd: t.StringDir;
    policy: Policy;
  };

  /** Materialized ZIP extension result. */
  export type WriteResult = {
    readonly path: t.StringPath;
    readonly args: readonly string[];
    readonly policy: Policy;
  };
}
