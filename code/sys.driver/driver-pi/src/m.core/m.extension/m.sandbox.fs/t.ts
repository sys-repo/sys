import type { t } from './common.ts';

/**
 * Wrapper-owned sandbox filesystem Pi extension.
 */
export declare namespace PiSandboxFsExtension {
  /** Runtime surface for the sandbox filesystem extension. */
  export type Lib = {
    /** Resolve effective remove-tool policy from profile policy and runtime roots. */
    resolvePolicy(input: ResolvePolicyInput): Policy;
    /** Convert enabled remove-tool policy to Pi prompt args. */
    toPromptArgs(policy: Policy): readonly string[];
    /** Materialize the generated Pi extension for the resolved policy. */
    write(input: WriteInput): Promise<WriteResult>;
  };

  /** Resolved remove-tool policy injected into the generated extension. */
  export type Policy = {
    /** Whether the `remove` tool is enabled for this launch. */
    readonly enabled: boolean;
    /** Whether recursive directory removal is permitted. */
    readonly recursive: boolean;
    /** Paths the `remove` tool may target, excluding protected descendants. */
    readonly removeRoots: readonly t.StringDir[];
    /** Paths and descendants the `remove` tool must refuse. */
    readonly protectedRoots: readonly t.StringPath[];
  };

  /** Inputs required to resolve the remove-tool policy. */
  export type ResolvePolicyInput = {
    /** Resolved Pi runtime cwd contract. */
    readonly cwd: t.PiCli.Cwd;
    /** Profile/caller-authored write roots before process-only write grants are added. */
    readonly write?: readonly t.StringPath[];
    /** Profile-authored remove-tool policy. */
    readonly remove?: t.PiCliProfiles.Tools.Remove;
  };

  /** Materialization request for the generated extension file. */
  export type WriteInput = {
    /** Runtime root under which `.pi/@sys/extensions` is materialized. */
    readonly cwd: t.StringDir;
    /** Resolved remove-tool policy to inject into the generated extension. */
    readonly policy: Policy;
    /** Preview materialization without writing files. */
    readonly dryRun?: boolean;
  };

  /** Materialization result for the generated extension file. */
  export type WriteResult = {
    /** Absolute generated extension path. */
    readonly path: t.StringPath;
    /** Pi CLI args that explicitly load the generated extension. */
    readonly args: readonly string[];
    /** Policy injected into the generated extension. */
    readonly policy: Policy;
    /** FileMap write operations emitted by the template engine. */
    readonly ops: readonly t.FileMapOp[];
    /** FileMap write totals emitted by the template engine. */
    readonly total: t.FileMapWriteResult['total'];
  };
}
