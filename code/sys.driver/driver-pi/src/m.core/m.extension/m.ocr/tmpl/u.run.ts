import type { CleanupRunner, OcrPdfSuccessDetails, OcrRunInput, ToolResult } from './t.ts';
import { runBudgetedCommand, runDenoCommand } from './u.command.ts';
import {
  guardExecutables,
  guardInput,
  parsePdfInfoPages,
  resolveLanguage,
  resolvePageRange,
} from './u.guard.ts';
import { resolvePath } from './u.path.ts';
import { formatOcrText, textBlock, toError, toErrorMessage } from './u.result.ts';

export async function runOcrPdfWithCommand(input: OcrRunInput): Promise<ToolResult> {
  const policy = input.policy;
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

  let source: Awaited<ReturnType<typeof guardInput>>;
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
