import type {
  GuardResult,
  OcrPdfFailureDetails,
  OcrPdfSuccessDetails,
  OcrPolicy,
  TextBlock,
  ToolResult,
} from './t.ts';

export function formatOcrText(details: OcrPdfSuccessDetails, text: string) {
  const truncated = details.truncated ? ', truncated' : '';
  return `OCR text from ${details.resolved} (pages ${details.pageStart}-${details.pageEnd}, ${details.language}, ${details.dpi} DPI${truncated}):\n\n${text}`;
}

export function toError(
  path: string,
  resolved: string | undefined,
  reason: string,
  substrate = false,
  policy?: OcrPolicy,
): ToolResult {
  const details: OcrPdfFailureDetails = {
    ok: false,
    path,
    ...(resolved ? { resolved } : {}),
    reason,
    ...(substrate && policy ? { installCommand: policy.installCommand.text } : {}),
  };

  return {
    content: [textBlock(`OCR failed: ${reason}`)],
    details,
    isError: true,
  };
}

export function textBlock(text: string): TextBlock {
  return { type: 'text', text };
}

export function blocked(
  requested: string,
  resolved: string | undefined,
  reason: string,
): GuardResult {
  return { ok: false, requested, ...(resolved ? { resolved } : {}), reason };
}

export function formatStderr(stderr: string) {
  const text = stderr.trim();
  return text ? ` Stderr: ${text}.` : '';
}

export function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
