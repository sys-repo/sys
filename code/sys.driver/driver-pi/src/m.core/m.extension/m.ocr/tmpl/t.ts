/**
 * Standalone generated-extension ABI types.
 *
 * These structural shapes intentionally duplicate host launcher contracts so the materialized
 * extension can run outside this repository without repo-local type imports. Keep this file
 * dependency-free and guard drift with host-policy compatibility tests.
 */
export type ExtensionApi = {
  readonly registerTool: <Params = OcrPdfParams, Details = OcrPdfDetails>(
    tool: RegisteredTool<Params, Details>,
  ) => void;
};

export type RegisteredTool<Params = OcrPdfParams, Details = OcrPdfDetails> = {
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

export type OcrPolicy = {
  readonly readRoots: readonly string[];
  readonly protectedRoots: readonly string[];
  readonly tmpRoot: string;
  readonly pdf: OcrPdfPolicy;
  readonly executables: OcrExecutables;
  readonly installCommand: OcrInstallCommand;
};

export type OcrPdfPolicy = {
  readonly enabled: boolean;
  readonly languages: readonly string[];
  readonly defaultLanguage: string;
  readonly dpi: number;
  readonly maxPages: number;
  readonly maxChars: number;
  readonly timeoutMs: number;
};

export type OcrExecutables = {
  readonly pdfinfo: string;
  readonly pdftoppm: string;
  readonly tesseract: string;
};

export type OcrInstallCommand = {
  readonly cmd: string;
  readonly args: readonly string[];
  readonly text: string;
};

export type OcrPdfParams = {
  readonly path: string;
  readonly pageStart?: number;
  readonly pageEnd?: number;
  readonly language?: string;
};

export type OcrPdfSuccessDetails = {
  readonly ok: true;
  readonly path: string;
  readonly resolved: string;
  readonly pageStart: number;
  readonly pageEnd: number;
  readonly pagesProcessed: number;
  readonly language: string;
  readonly dpi: number;
  readonly chars: number;
  readonly truncated: boolean;
  readonly cleanup?: { readonly ok: false; readonly reason: string };
};

export type OcrPdfFailureDetails = {
  readonly ok: false;
  readonly path: string;
  readonly resolved?: string;
  readonly reason: string;
  readonly installCommand?: string;
};

export type OcrPdfDetails = OcrPdfSuccessDetails | OcrPdfFailureDetails;

export type TextBlock = {
  readonly type: 'text';
  readonly text: string;
};

export type ToolResult<Details = OcrPdfDetails> = {
  readonly content: readonly TextBlock[];
  readonly details: Details;
  readonly isError?: true;
};

export type CommandInput = {
  readonly cmd: string;
  readonly args: readonly string[];
  readonly timeoutMs: number;
  readonly maxStdoutBytes: number;
  readonly maxStderrBytes: number;
  readonly signal?: AbortSignal;
};

export type CommandOutput = {
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
  readonly timedOut?: boolean;
  readonly cancelled?: boolean;
  readonly failedToStart?: boolean;
  readonly stdoutTruncated?: boolean;
  readonly stderrTruncated?: boolean;
};

export type CommandRunner = (input: CommandInput) => Promise<CommandOutput>;
export type CleanupRunner = (path: string) => Promise<OcrPdfSuccessDetails['cleanup']>;

export type GuardResult =
  | {
    readonly ok: true;
    readonly requested: string;
    readonly resolved: string;
    readonly root: string;
  }
  | {
    readonly ok: false;
    readonly requested: string;
    readonly resolved?: string;
    readonly reason: string;
  };

export type PageRange = {
  readonly pageStart: number;
  readonly pageEnd: number;
  readonly pagesRequested: number;
};

export type OcrRunInput = {
  readonly params: OcrPdfParams;
  readonly cwd: string;
  readonly policy: OcrPolicy;
  readonly command?: CommandRunner;
  readonly cleanup?: CleanupRunner;
  readonly signal?: AbortSignal;
};

export type OcrRunTestInput = Omit<OcrRunInput, 'policy'> & { readonly policy?: OcrPolicy };
