export type ExtensionApi = {
  readonly registerTool: <Params, Details>(tool: RegisteredTool<Params, Details>) => void;
};

export type RegisteredTool<Params, Details> = {
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
    ctx: { readonly cwd: string },
  ) => Promise<ToolResult<Details>>;
};

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

export type TextBlock = {
  readonly type: 'text';
  readonly text: string;
};

export type ToolResult<Details> = {
  readonly content: readonly TextBlock[];
  readonly details: Details;
  readonly isError?: boolean;
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
