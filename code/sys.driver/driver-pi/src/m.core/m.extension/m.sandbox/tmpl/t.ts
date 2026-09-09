/**
 * Standalone generated-extension ABI types.
 *
 * These structural shapes intentionally duplicate host launcher contracts so the materialized
 * extension can run outside this repository without repo-local type imports. Keep this file
 * dependency-free and guard drift with host-policy compatibility tests.
 */
export type ExtensionApi = {
  readonly registerTool: <Params = SandboxFsParams, Details = SandboxFsDetails>(
    tool: RegisteredTool<Params, Details>,
  ) => void;
};

export type RegisteredTool<Params = SandboxFsParams, Details = SandboxFsDetails> = {
  readonly name: string;
  readonly label: string;
  readonly description: string;
  readonly promptSnippet: string;
  readonly promptGuidelines: readonly string[];
  readonly parameters: JsonSchema;
  readonly execute: (
    toolCallId: string,
    params: Params,
    signal: AbortSignal | undefined,
    onUpdate: unknown,
    ctx: ToolContext,
  ) => Promise<ToolResult<Details>>;
};

export type ToolContext = { readonly cwd: string };

export type JsonSchema = {
  readonly type: string;
  readonly additionalProperties?: boolean;
  readonly required?: readonly string[];
  readonly properties?: Record<string, JsonSchema>;
  readonly minimum?: number;
  readonly description?: string;
};

export type FileInfo = {
  readonly isFile: boolean;
  readonly isDirectory: boolean;
  readonly isSymlink: boolean;
};

export type SandboxFsPolicy = {
  readonly readRoots: readonly string[];
  readonly writeRoots: readonly string[];
  readonly protectedRoots: readonly string[];
  readonly remove: RemovePolicy;
  readonly move: MovePolicy;
  readonly copy: CopyPolicy;
};

export type RemovePolicy = { readonly enabled: boolean; readonly recursive: boolean };

export type MovePolicy = { readonly enabled: boolean };

export type CopyPolicy = { readonly enabled: boolean };

export type RemoveParams = { readonly path: string; readonly recursive?: boolean };

export type MoveParams = { readonly from: string; readonly to: string };

export type CopyParams = { readonly from: string; readonly to: string };

export type SandboxFsParams = RemoveParams | MoveParams | CopyParams;

export type RemoveDetails = {
  readonly ok: boolean;
  readonly path: string;
  readonly resolved: string;
  readonly recursive: boolean;
  readonly reason?: string;
};

export type MoveDetails = {
  readonly ok: boolean;
  readonly from: string;
  readonly to: string;
  readonly resolvedFrom: string;
  readonly resolvedTo: string;
  readonly reason?: string;
};

export type CopyDetails = {
  readonly ok: boolean;
  readonly from: string;
  readonly to: string;
  readonly resolvedFrom: string;
  readonly resolvedTo: string;
  readonly reason?: string;
};

export type SandboxFsDetails = RemoveDetails | MoveDetails | CopyDetails;

export type TextBlock = {
  readonly type: 'text';
  readonly text: string;
};

export type ToolResult<Details = SandboxFsDetails> = {
  readonly content: readonly TextBlock[];
  readonly details: Details;
  readonly isError?: true;
};

export type RemoveGuardInput = {
  readonly requested: string;
  readonly target: string;
  readonly recursive: boolean;
  readonly policy: SandboxFsPolicy;
};

export type MoveGuardInput = {
  readonly from: string;
  readonly to: string;
  readonly resolvedFrom: string;
  readonly resolvedTo: string;
  readonly policy: SandboxFsPolicy;
};

export type CopyGuardInput = {
  readonly from: string;
  readonly to: string;
  readonly resolvedFrom: string;
  readonly resolvedTo: string;
  readonly policy: SandboxFsPolicy;
};

export type GuardResult =
  | { readonly ok: true; readonly info?: FileInfo }
  | { readonly ok: false; readonly reason: string };

export type PathGuardResult =
  | { readonly ok: true; readonly root: string }
  | { readonly ok: false; readonly reason: string };
