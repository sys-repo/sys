import type { ExtensionAPI } from '@mariozechner/pi-coding-agent';
import { Process } from '@sys/process/process';
import { Type } from 'typebox';

type OcrPolicy = {
  readonly readRoots: readonly string[];
  readonly protectedRoots: readonly string[];
  readonly tmpRoot: string;
  readonly pdf: OcrPdfPolicy;
  readonly executables: OcrExecutables;
  readonly installCommand: OcrInstallCommand;
};

type OcrPdfPolicy = {
  readonly enabled: boolean;
  readonly languages: readonly string[];
  readonly defaultLanguage: string;
  readonly dpi: number;
  readonly maxPages: number;
  readonly maxChars: number;
  readonly timeoutMs: number;
};

type OcrExecutables = {
  readonly pdfinfo: string;
  readonly pdftoppm: string;
  readonly tesseract: string;
};

type OcrInstallCommand = {
  readonly cmd: string;
  readonly args: readonly string[];
  readonly text: string;
};

type OcrPdfParams = {
  readonly path: string;
  readonly pageStart?: number;
  readonly pageEnd?: number;
  readonly language?: string;
};

type OcrPdfSuccessDetails = {
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

type OcrPdfFailureDetails = {
  readonly ok: false;
  readonly path: string;
  readonly resolved?: string;
  readonly reason: string;
  readonly installCommand?: string;
};

type TextBlock = {
  readonly type: 'text';
  readonly text: string;
};

type ToolResult = {
  readonly content: TextBlock[];
  readonly details: OcrPdfSuccessDetails | OcrPdfFailureDetails;
  readonly isError?: true;
};

type CommandInput = {
  readonly cmd: string;
  readonly args: readonly string[];
  readonly timeoutMs: number;
  readonly maxStdoutBytes: number;
  readonly maxStderrBytes: number;
  readonly signal?: AbortSignal;
};

type CommandOutput = {
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
  readonly timedOut?: boolean;
  readonly cancelled?: boolean;
  readonly failedToStart?: boolean;
  readonly stdoutTruncated?: boolean;
  readonly stderrTruncated?: boolean;
};

type CommandRunner = (input: CommandInput) => Promise<CommandOutput>;
type CleanupRunner = (path: string) => Promise<OcrPdfSuccessDetails['cleanup']>;

type GuardResult =
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

type PageRange = {
  readonly pageStart: number;
  readonly pageEnd: number;
  readonly pagesRequested: number;
};

type OcrRunInput = {
  readonly params: OcrPdfParams;
  readonly cwd: string;
  readonly policy?: OcrPolicy;
  readonly command?: CommandRunner;
  readonly cleanup?: CleanupRunner;
  readonly signal?: AbortSignal;
};

declare const __OCR_POLICY__: OcrPolicy;
const POLICY: OcrPolicy = __OCR_POLICY__;
const COMMAND_STDOUT_BYTES = 64_000;
const COMMAND_STDERR_BYTES = 64_000;

const ocrPdfParameters = Type.Object(
  {
    path: Type.String({
      description:
        'Readable PDF path to OCR, relative to cwd or absolute inside a configured readable sandbox root.',
    }),
    pageStart: Type.Optional(Type.Integer({
      minimum: 1,
      description: 'First 1-based page to OCR. Defaults to 1.',
    })),
    pageEnd: Type.Optional(Type.Integer({
      minimum: 1,
      description:
        'Last 1-based page to OCR. Defaults to the bounded page window allowed by policy.',
    })),
    language: Type.Optional(Type.String({
      description: 'OCR language code. Must be one of the active OCR policy languages.',
    })),
  },
  { additionalProperties: false },
);

export default function ocr(pi: ExtensionAPI) {
  if (!POLICY.pdf.enabled) return;

  pi.registerTool({
    name: 'ocr_pdf',
    label: 'OCR PDF',
    description:
      'Extract text from scanned or image-based PDF pages through optical character recognition (OCR). No shell commands.',
    promptSnippet: 'Extract OCR text from a readable PDF through the wrapper-owned ocr_pdf tool.',
    promptGuidelines: [
      'Use ocr_pdf only when a PDF is scanned/image-based or usable embedded text is unavailable.',
      'Provide the exact PDF path and the narrowest page range that can answer the task.',
      'Do not use ocr_pdf as a general PDF parser, summarizer, or embedded-text extractor.',
      'Do not invoke bash, pdfinfo, pdftoppm, tesseract, shell redirection, heredocs, or ad hoc scripts for OCR.',
      'OCR is lossy and may be truncated by active profile policy; report uncertainty and truncation explicitly.',
    ],
    parameters: ocrPdfParameters,

    async execute(_toolCallId, params: OcrPdfParams, signal, _onUpdate, ctx) {
      return await runOcrPdfWithCommand({
        params,
        cwd: ctx.cwd,
        policy: POLICY,
        command: runDenoCommand,
        signal,
      });
    },
  });
}

export const __ocrPdfTest = {
  guardInput,
  parsePdfInfoPages,
  resolvePageRange,
  runOcrPdfWithCommand,
  runDenoCommand,
} as const;

async function runOcrPdfWithCommand(input: OcrRunInput): Promise<ToolResult> {
  const policy = input.policy ?? POLICY;
  const command = input.command ?? runDenoCommand;
  const cleanupTemp = input.cleanup ?? cleanupTempDir;
  const signal = input.signal;
  const requested = input.params.path?.trim?.() ?? '';

  if (!policy.pdf.enabled) {
    return toError(requested, undefined, 'ocr_pdf is disabled by active profile policy.');
  }

  const startingCancellation = cancellationReason(
    signal,
    'ocr_pdf was cancelled before it started.',
  );
  if (startingCancellation) return toError(requested, undefined, startingCancellation);

  const executableGuard = guardExecutables(policy.executables);
  if (!executableGuard.ok) {
    return toError(requested, undefined, executableGuard.reason, true, policy);
  }

  const language = resolveLanguage(input.params.language, policy.pdf);
  if (!language.ok) return toError(requested, undefined, language.reason);

  let source: GuardResult;
  try {
    source = await guardInput({ requested, cwd: input.cwd, policy });
  } catch (error) {
    return toError(requested, undefined, `ocr_pdf input guard failed: ${toErrorMessage(error)}`);
  }
  if (!source.ok) return toError(source.requested, source.resolved, source.reason);

  const deadline = Date.now() + policy.pdf.timeoutMs;
  const pdfinfo = await runBudgetedCommand({
    label: 'pdfinfo',
    cmd: policy.executables.pdfinfo,
    args: [source.resolved],
    deadline,
    policy,
    command,
    signal,
  });
  if (!pdfinfo.ok) {
    return toError(source.requested, source.resolved, pdfinfo.reason, pdfinfo.substrate, policy);
  }

  const pagesTotal = parsePdfInfoPages(pdfinfo.output.stdout);
  if (pagesTotal === undefined) {
    return toError(
      source.requested,
      source.resolved,
      'pdfinfo could not determine a PDF page count.',
    );
  }

  const range = resolvePageRange(input.params, pagesTotal, policy.pdf.maxPages);
  if (!range.ok) return toError(source.requested, source.resolved, range.reason);

  let tmpDir: string | undefined;
  let cleanup: OcrPdfSuccessDetails['cleanup'];
  let text = '';
  let pagesProcessed = 0;
  let truncated = false;

  try {
    const beforeWorkCancellation = cancellationReason(signal);
    if (beforeWorkCancellation) {
      return toError(source.requested, source.resolved, beforeWorkCancellation);
    }

    await Deno.mkdir(policy.tmpRoot, { recursive: true });
    tmpDir = await Deno.makeTempDir({ dir: policy.tmpRoot, prefix: 'ocr-' });

    for (let page = range.value.pageStart; page <= range.value.pageEnd; page++) {
      const pageCancellation = cancellationReason(signal);
      if (pageCancellation) return toError(source.requested, source.resolved, pageCancellation);

      const prefix = resolvePath(tmpDir, `page-${page}`);
      const image = `${prefix}.png`;

      const render = await runBudgetedCommand({
        label: 'pdftoppm',
        cmd: policy.executables.pdftoppm,
        args: [
          '-r',
          String(policy.pdf.dpi),
          '-f',
          String(page),
          '-l',
          String(page),
          '-singlefile',
          '-png',
          source.resolved,
          prefix,
        ],
        deadline,
        policy,
        command,
        signal,
      });
      if (!render.ok) {
        return toError(source.requested, source.resolved, render.reason, render.substrate, policy);
      }

      const ocr = await runBudgetedCommand({
        label: 'tesseract',
        cmd: policy.executables.tesseract,
        args: [image, 'stdout', '-l', language.value, '--dpi', String(policy.pdf.dpi)],
        deadline,
        policy,
        command,
        signal,
      });
      if (!ocr.ok) {
        return toError(source.requested, source.resolved, ocr.reason, ocr.substrate, policy);
      }

      pagesProcessed += 1;
      const pageText = appendPageSeparator(text, ocr.output.stdout);
      const remaining = policy.pdf.maxChars - text.length;
      if (pageText.length > remaining) {
        text += pageText.slice(0, Math.max(remaining, 0));
        truncated = true;
        break;
      }

      text += pageText;
      if (ocr.output.stdoutTruncated) {
        truncated = true;
        break;
      }
      if (text.length >= policy.pdf.maxChars && page < range.value.pageEnd) {
        truncated = true;
        break;
      }
    }
  } catch (error) {
    return toError(source.requested, source.resolved, toErrorMessage(error));
  } finally {
    if (tmpDir) cleanup = await cleanupSafely(cleanupTemp, tmpDir);
  }

  const details: OcrPdfSuccessDetails = {
    ok: true,
    path: source.requested,
    resolved: source.resolved,
    pageStart: range.value.pageStart,
    pageEnd: range.value.pageEnd,
    pagesProcessed,
    language: language.value,
    dpi: policy.pdf.dpi,
    chars: text.length,
    truncated,
    ...(cleanup ? { cleanup } : {}),
  };

  return {
    content: [textBlock(formatOcrText(details, text))],
    details,
  };
}

async function guardInput(input: {
  readonly requested: string;
  readonly cwd: string;
  readonly policy?: OcrPolicy;
}): Promise<GuardResult> {
  let requested = '';
  try {
    requested = input.requested.trim();
    return await guardInputUnsafe(input, requested);
  } catch (error) {
    return blocked(requested, undefined, `ocr_pdf input guard failed: ${toErrorMessage(error)}`);
  }
}

async function guardInputUnsafe(
  input: {
    readonly requested: string;
    readonly cwd: string;
    readonly policy?: OcrPolicy;
  },
  requested: string,
): Promise<GuardResult> {
  const policy = input.policy ?? POLICY;
  if (!requested) return blocked(requested, undefined, 'ocr_pdf requires a non-empty PDF path.');
  if (requested.startsWith('~')) {
    return blocked(requested, undefined, 'ocr_pdf does not expand ~ paths.');
  }
  if (hasParentSegment(requested)) {
    return blocked(requested, undefined, 'ocr_pdf refuses paths containing .. segments.');
  }
  if (hasGlobChars(requested)) {
    return blocked(requested, undefined, 'ocr_pdf refuses glob-shaped paths.');
  }

  const resolved = resolvePath(input.cwd, requested);
  const readRoot = findContainingRoot(resolved, policy.readRoots);
  if (!readRoot) {
    return blocked(
      requested,
      resolved,
      `ocr_pdf source is outside configured readable sandbox roots: ${resolved}`,
    );
  }
  if (isInsideAny(resolved, policy.protectedRoots)) {
    return blocked(requested, resolved, 'ocr_pdf refuses protected control/runtime paths.');
  }

  let info: Deno.FileInfo | undefined;
  try {
    info = await lstat(resolved);
  } catch (error) {
    return blocked(
      requested,
      resolved,
      `ocr_pdf could not inspect source path: ${toErrorMessage(error)}`,
    );
  }
  if (!info) return blocked(requested, resolved, `ocr_pdf source does not exist: ${resolved}`);

  let intermediate: Awaited<ReturnType<typeof guardIntermediateSymlinks>>;
  try {
    intermediate = await guardIntermediateSymlinks(readRoot, resolved);
  } catch (error) {
    return blocked(
      requested,
      resolved,
      `ocr_pdf could not inspect source parents: ${toErrorMessage(error)}`,
    );
  }
  if (!intermediate.ok) return blocked(requested, resolved, intermediate.reason);

  if (info.isSymlink) {
    return blocked(requested, resolved, 'ocr_pdf refuses final-path symlink sources.');
  }
  if (!info.isFile) {
    return blocked(requested, resolved, 'ocr_pdf source must be a regular PDF file.');
  }
  if (!resolved.toLowerCase().endsWith('.pdf')) {
    return blocked(requested, resolved, 'ocr_pdf source must have a .pdf extension.');
  }

  return { ok: true, requested, resolved, root: readRoot };
}

function guardExecutables(executables: OcrExecutables) {
  for (const [name, value] of Object.entries(executables)) {
    if (!value) {
      return {
        ok: false as const,
        reason: `OCR dependency executable is missing from generated policy: ${name}.`,
      };
    }
    if (!isAbsolutePath(value)) {
      return {
        ok: false as const,
        reason: `OCR dependency executable must be an absolute path: ${name}.`,
      };
    }
  }
  return { ok: true as const };
}

function resolveLanguage(input: string | undefined, policy: OcrPdfPolicy) {
  const language = input?.trim() || policy.defaultLanguage;
  if (policy.languages.includes(language)) return { ok: true as const, value: language };
  return {
    ok: false as const,
    reason:
      `OCR language is not allowed by active profile policy: ${language}. Allowed languages: ${
        policy.languages.join(', ')
      }.`,
  };
}

function parsePdfInfoPages(stdout: string) {
  const match = /^Pages:\s*([0-9]+)\s*$/im.exec(stdout);
  if (!match) return undefined;
  const count = Number(match[1]);
  if (!Number.isSafeInteger(count) || count < 1) return undefined;
  return count;
}

function resolvePageRange(params: OcrPdfParams, pagesTotal: number, maxPages: number) {
  const pageStart = params.pageStart ?? 1;
  const pageEnd = params.pageEnd ?? Math.min(pagesTotal, pageStart + maxPages - 1);

  if (!Number.isInteger(pageStart) || pageStart < 1) {
    return { ok: false as const, reason: 'ocr_pdf pageStart must be a positive integer.' };
  }
  if (!Number.isInteger(pageEnd) || pageEnd < 1) {
    return { ok: false as const, reason: 'ocr_pdf pageEnd must be a positive integer.' };
  }
  if (pageStart > pageEnd) {
    return {
      ok: false as const,
      reason: 'ocr_pdf pageStart must be less than or equal to pageEnd.',
    };
  }
  if (pageEnd > pagesTotal) {
    return {
      ok: false as const,
      reason: `ocr_pdf pageEnd exceeds PDF page count (${pagesTotal}).`,
    };
  }

  const pagesRequested = pageEnd - pageStart + 1;
  if (pagesRequested > maxPages) {
    return {
      ok: false as const,
      reason: `ocr_pdf page range exceeds active profile policy maxPages (${maxPages}).`,
    };
  }

  return { ok: true as const, value: { pageStart, pageEnd, pagesRequested } satisfies PageRange };
}

async function runBudgetedCommand(input: {
  readonly label: string;
  readonly cmd: string;
  readonly args: readonly string[];
  readonly deadline: number;
  readonly policy: OcrPolicy;
  readonly command: CommandRunner;
  readonly signal?: AbortSignal;
}) {
  const timeoutMs = input.deadline - Date.now();
  if (timeoutMs <= 0) {
    return {
      ok: false as const,
      reason:
        `OCR command budget exceeded before ${input.label} could start (${input.policy.pdf.timeoutMs}ms).`,
      substrate: false,
    };
  }
  if (input.signal?.aborted) {
    return {
      ok: false as const,
      reason: `OCR command was cancelled before ${input.label} could start.`,
      substrate: false,
    };
  }

  const caps = commandCaps(input.label, input.policy);
  let output: CommandOutput;
  try {
    output = await input.command({
      cmd: input.cmd,
      args: input.args,
      timeoutMs,
      ...caps,
      signal: input.signal,
    });
  } catch (error) {
    if (input.signal?.aborted) {
      return {
        ok: false as const,
        reason: `${input.label} command was cancelled.`,
        substrate: false,
      };
    }
    return {
      ok: false as const,
      reason: `${input.label} command runner failed: ${toErrorMessage(error)}`,
      substrate: false,
    };
  }
  if (output.cancelled) {
    return {
      ok: false as const,
      reason: `${input.label} command was cancelled.`,
      substrate: false,
    };
  }
  if (output.timedOut) {
    return {
      ok: false as const,
      reason:
        `${input.label} command exceeded OCR timeout budget (${input.policy.pdf.timeoutMs}ms).`,
      substrate: false,
    };
  }
  if (output.failedToStart) {
    return {
      ok: false as const,
      reason: `${input.label} command could not start: ${input.cmd}.${
        formatStderr(output.stderr)
      } Install with: ${input.policy.installCommand.text}`,
      substrate: true,
    };
  }
  if (output.code !== 0) {
    return {
      ok: false as const,
      reason: `${input.label} command failed with exit code ${output.code}.${
        formatStderr(output.stderr)
      }`,
      substrate: false,
    };
  }

  return { ok: true as const, output };
}

function commandCaps(label: string, policy: OcrPolicy) {
  return {
    maxStdoutBytes: label === 'tesseract'
      ? policy.pdf.maxChars
      : COMMAND_STDOUT_BYTES,
    maxStderrBytes: COMMAND_STDERR_BYTES,
  };
}

async function runDenoCommand(input: CommandInput): Promise<CommandOutput> {
  const output = await Process.capture({
    cmd: input.cmd,
    args: [...input.args],
    signal: input.signal,
    timeoutMs: input.timeoutMs,
    maxStdoutBytes: input.maxStdoutBytes,
    maxStderrBytes: input.maxStderrBytes,
  });

  if (output.outcome === 'timed-out') return stoppedOutput(output, 'timedOut');
  if (output.outcome === 'cancelled') return stoppedOutput(output, 'cancelled');
  if (output.outcome === 'failed-to-start') {
    return {
      code: -1,
      stdout: output.text.stdout,
      stderr: toErrorMessage(output.error),
      failedToStart: true,
      stdoutTruncated: output.stdoutTruncated,
      stderrTruncated: output.stderrTruncated,
    };
  }

  return {
    code: output.code,
    stdout: output.text.stdout,
    stderr: output.text.stderr,
    stdoutTruncated: output.stdoutTruncated,
    stderrTruncated: output.stderrTruncated,
  };
}

function stoppedOutput(
  output: Awaited<ReturnType<typeof Process.capture>>,
  flag: 'cancelled' | 'timedOut',
): CommandOutput {
  return {
    code: output.code ?? -1,
    stdout: output.text.stdout,
    stderr: output.text.stderr ||
      (flag === 'cancelled' ? 'command cancelled' : 'command timed out'),
    [flag]: true,
    stdoutTruncated: output.stdoutTruncated,
    stderrTruncated: output.stderrTruncated,
  };
}

function appendPageSeparator(existing: string, pageText: string) {
  if (!existing) return pageText;
  if (!pageText) return '\n\n';
  return `\n\n${pageText}`;
}

async function cleanupTempDir(path: string): Promise<OcrPdfSuccessDetails['cleanup']> {
  try {
    await Deno.remove(path, { recursive: true });
    return undefined;
  } catch (error) {
    return { ok: false, reason: toErrorMessage(error) };
  }
}

async function cleanupSafely(
  cleanup: CleanupRunner,
  path: string,
): Promise<OcrPdfSuccessDetails['cleanup']> {
  try {
    return await cleanup(path);
  } catch (error) {
    return { ok: false, reason: `cleanup failed: ${toErrorMessage(error)}` };
  }
}

function cancellationReason(signal: AbortSignal | undefined, reason = 'ocr_pdf was cancelled.') {
  return signal?.aborted ? reason : undefined;
}

function formatOcrText(details: OcrPdfSuccessDetails, text: string) {
  const truncated = details.truncated ? ', truncated' : '';
  return `OCR text from ${details.resolved} (pages ${details.pageStart}-${details.pageEnd}, ${details.language}, ${details.dpi} DPI${truncated}):\n\n${text}`;
}

function toError(
  path: string,
  resolved: string | undefined,
  reason: string,
  substrate = false,
  policy: OcrPolicy = POLICY,
): ToolResult {
  const details: OcrPdfFailureDetails = {
    ok: false,
    path,
    ...(resolved ? { resolved } : {}),
    reason,
    ...(substrate ? { installCommand: policy.installCommand.text } : {}),
  };

  return {
    content: [textBlock(`OCR failed: ${reason}`)],
    details,
    isError: true,
  };
}

function textBlock(text: string): TextBlock {
  return { type: 'text', text };
}

function blocked(requested: string, resolved: string | undefined, reason: string): GuardResult {
  return { ok: false, requested, ...(resolved ? { resolved } : {}), reason };
}

async function lstat(path: string): Promise<Deno.FileInfo | undefined> {
  try {
    return await Deno.lstat(path);
  } catch (error) {
    if (isNotFound(error)) return undefined;
    throw error;
  }
}

async function guardIntermediateSymlinks(root: string, target: string) {
  const relative = relativePath(root, target);
  const segments = relative.split(/[\\/]+/).filter((segment) => segment.length > 0);
  const intermediates = segments.slice(0, -1);
  let current = root;

  for (const segment of intermediates) {
    current = resolvePath(current, segment);
    const info = await lstat(current);
    if (!info) return { ok: false as const, reason: `ocr_pdf parent does not exist: ${current}` };
    if (info.isSymlink) {
      return {
        ok: false as const,
        reason: `ocr_pdf refuses intermediate symlink traversal: ${current}`,
      };
    }
  }

  return { ok: true as const };
}

function findContainingRoot(target: string, roots: readonly string[]) {
  return roots.map(normalizePath).find((root) => isWithinOrEqual(root, target));
}

function isInsideAny(target: string, roots: readonly string[]) {
  return roots.map(normalizePath).some((root) => isWithinOrEqual(root, target));
}

function isWithinOrEqual(root: string, target: string) {
  const relative = relativePath(root, target);
  return relative === '' || (!relative.startsWith('..') && !isAbsolutePath(relative));
}

function resolvePath(...parts: readonly string[]) {
  let path = '';
  for (const part of parts) {
    if (!part) continue;
    if (isAbsolutePath(part)) path = part;
    else path = path ? `${path}/${part}` : part;
  }
  if (!path) path = '.';
  if (!isAbsolutePath(path)) path = `${Deno.cwd()}/${path}`;
  return normalizePath(path);
}

function normalizePath(input: string) {
  const path = input.replaceAll('\\', '/');
  const absolute = isAbsolutePath(path);
  const drive = absolute ? windowsDrive(path) : undefined;
  const prefix = drive ? `${drive}/` : absolute ? '/' : '';
  const rest = drive ? path.slice(drive.length + 1) : absolute ? path.slice(1) : path;
  const output: string[] = [];

  for (const segment of rest.split('/')) {
    if (!segment || segment === '.') continue;
    if (segment === '..') {
      if (output.length > 0 && output.at(-1) !== '..') output.pop();
      else if (!absolute) output.push(segment);
      continue;
    }
    output.push(segment);
  }

  const normalized = `${prefix}${output.join('/')}`;
  if (normalized) return normalized;
  return absolute ? prefix || '/' : '.';
}

function relativePath(from: string, to: string) {
  const fromSegments = pathSegments(normalizePath(from));
  const toSegments = pathSegments(normalizePath(to));
  let shared = 0;
  while (shared < fromSegments.length && fromSegments[shared] === toSegments[shared]) shared += 1;
  const up = Array.from({ length: fromSegments.length - shared }, () => '..');
  return [...up, ...toSegments.slice(shared)].join('/');
}

function pathSegments(path: string) {
  const normalized = normalizePath(path);
  const drive = windowsDrive(normalized);
  const rest = drive ? normalized.slice(drive.length + 1) : normalized;
  return rest.split('/').filter((segment) => segment.length > 0);
}

function isAbsolutePath(path: string) {
  return path.startsWith('/') || path.startsWith('\\\\') || windowsDrive(path) !== undefined;
}

function windowsDrive(path: string) {
  const match = /^[A-Za-z]:/.exec(path);
  return match?.[0];
}

function hasParentSegment(path: string) {
  return path.split(/[\\/]+/).some((segment) => segment === '..');
}

function hasGlobChars(path: string) {
  return /[*?\[\]{}]/.test(path);
}

function isNotFound(error: unknown) {
  return error instanceof Deno.errors.NotFound ||
    (error instanceof Error && error.name === 'NotFound');
}

function formatStderr(stderr: string) {
  const text = stderr.trim();
  return text ? ` Stderr: ${text}.` : '';
}

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
