import type { t } from './common.ts';

/**
 * Wrapper-owned sandbox filesystem Pi extension.
 */
export declare namespace PiSandboxFsExtension {
  /** Runtime surface for the sandbox filesystem extension. */
  export type Lib = {
    /** Resolve effective sandbox filesystem tool policy from profile policy and runtime roots. */
    resolvePolicy(input: ResolvePolicyInput): Policy;
    /** Convert enabled sandbox filesystem tool policy to Pi prompt args. */
    toPromptArgs(policy: Policy): readonly string[];
    /** Materialize the generated Pi extension for the resolved policy. */
    write(input: WriteInput): Promise<WriteResult>;
  };

  /** Resolved sandbox filesystem tool policy injected into the generated extension. */
  export type Policy = {
    /** Paths readable by import-style operations such as `copy.from`. */
    readonly readRoots: readonly t.StringPath[];
    /** Paths writable by mutating operations such as `remove`, `move`, and `copy.to`. */
    readonly writeRoots: readonly t.StringPath[];
    /** Paths and descendants the sandbox filesystem tools must refuse. */
    readonly protectedRoots: readonly t.StringPath[];
    /** Resolved remove-tool policy. */
    readonly remove: RemovePolicy;
    /** Resolved move-tool policy. */
    readonly move: MovePolicy;
    /** Resolved copy-tool policy. */
    readonly copy: CopyPolicy;
  };

  /** Resolved remove-tool policy. */
  export type RemovePolicy = {
    /** Whether the `remove` tool is enabled for this launch. */
    readonly enabled: boolean;
    /** Whether recursive directory removal is permitted. */
    readonly recursive: boolean;
  };

  /** Resolved move-tool policy. */
  export type MovePolicy = {
    /** Whether the `move` tool is enabled for this launch. */
    readonly enabled: boolean;
  };

  /** Resolved copy-tool policy. */
  export type CopyPolicy = {
    /** Whether the `copy` tool is enabled for this launch. */
    readonly enabled: boolean;
  };

  /** Inputs required to resolve the sandbox filesystem tool policy. */
  export type ResolvePolicyInput = {
    /** Resolved Pi runtime cwd contract. */
    readonly cwd: t.PiCli.Cwd;
    /** Profile/caller-authored read roots before process-only read grants are added. */
    readonly read?: readonly t.StringPath[];
    /** Profile/caller-authored write roots before process-only write grants are added. */
    readonly write?: readonly t.StringPath[];
    /** Profile-authored remove-tool policy. */
    readonly remove?: t.PiCliProfiles.Tools.Remove;
    /** Profile-authored move-tool policy. */
    readonly move?: t.PiCliProfiles.Tools.Move;
    /** Profile-authored copy-tool policy. */
    readonly copy?: t.PiCliProfiles.Tools.Copy;
  };

  /** Materialization request for the generated extension file. */
  export type WriteInput = {
    /** Runtime root under which `.pi/@sys/extensions` is materialized. */
    readonly cwd: t.StringDir;
    /** Resolved sandbox filesystem tool policy to inject into the generated extension. */
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
    readonly ops: readonly t.FileMap.Write.Op.Any[];
    /** FileMap write totals emitted by the template engine. */
    readonly total: t.FileMap.Write.Result['total'];
  };
}
