import { Path, type t } from '../common.ts';

export type RegisteredTool = { readonly name: string };

export type OcrCommandInput = {
  readonly cmd: string;
  readonly args: readonly string[];
  readonly timeoutMs: number;
  readonly maxStdoutBytes: number;
  readonly maxStderrBytes: number;
  readonly signal?: AbortSignal;
};

export type OcrCommandOutput = {
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
  readonly timedOut?: boolean;
  readonly cancelled?: boolean;
  readonly failedToStart?: boolean;
  readonly stdoutTruncated?: boolean;
  readonly stderrTruncated?: boolean;
};

export type OcrToolResult = {
  readonly content: readonly { readonly type: string; readonly text: string }[];
  readonly details: Record<string, unknown>;
  readonly isError?: true;
};

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

export type GeneratedOcrTestModule = {
  readonly default: (pi: { registerTool(tool: RegisteredTool): void }) => void;
  readonly __ocrPdfTest: {
    readonly guardInput: (input: {
      readonly requested: string;
      readonly cwd: string;
      readonly policy?: t.PiOcrExtension.Extension.Policy;
    }) => Promise<GuardResult>;
    readonly parsePdfInfoPages: (stdout: string) => number | undefined;
    readonly resolvePageRange: (
      params: { readonly pageStart?: number; readonly pageEnd?: number },
      pagesTotal: number,
      maxPages: number,
    ) => { readonly ok: true; readonly value: unknown } | {
      readonly ok: false;
      readonly reason: string;
    };
    readonly runOcrPdfWithCommand: (input: {
      readonly params: {
        readonly path: string;
        readonly pageStart?: number;
        readonly pageEnd?: number;
        readonly language?: string;
      };
      readonly cwd: string;
      readonly policy?: t.PiOcrExtension.Extension.Policy;
      readonly command?: (input: OcrCommandInput) => Promise<OcrCommandOutput>;
      readonly cleanup?: (
        path: string,
      ) => Promise<{ readonly ok: false; readonly reason: string } | undefined>;
      readonly signal?: AbortSignal;
    }) => Promise<OcrToolResult>;
    readonly runDenoCommand: (input: OcrCommandInput) => Promise<OcrCommandOutput>;
  };
};

export function commandCaps() {
  return { maxStdoutBytes: 64_000, maxStderrBytes: 64_000 };
}

export function ocrExecutables(): t.PiOcrExtension.Dependency.Executables {
  return {
    pdfinfo: '/ocr/bin/pdfinfo' as t.StringPath,
    pdftoppm: '/ocr/bin/pdftoppm' as t.StringPath,
    tesseract: '/ocr/bin/tesseract' as t.StringPath,
  };
}

export async function importGenerated(path: t.StringPath): Promise<GeneratedOcrTestModule> {
  const url = Path.toFileUrl(path);
  url.search = `v=${Date.now()}.${Math.random()}`;
  return await import(url.href) as GeneratedOcrTestModule;
}
