import type { ExtensionApi, OcrPolicy, OcrRunInput, OcrRunTestInput } from './t.ts';
import { runDenoCommand } from './u.command.ts';
import { guardInput, parsePdfInfoPages, resolvePageRange } from './u.guard.ts';
import { runOcrPdfWithCommand } from './u.run.ts';
import { ocrPdfParameters } from './u.schema.ts';

declare const __OCR_POLICY__: OcrPolicy;
const POLICY: OcrPolicy = __OCR_POLICY__;

export default function ocr(pi: ExtensionApi) {
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

    async execute(_toolCallId, params, signal, _onUpdate, ctx) {
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
  guardInput: (input: Parameters<typeof guardInput>[0] & { readonly policy?: OcrPolicy }) => {
    return guardInput({ ...input, policy: input.policy ?? POLICY });
  },
  parsePdfInfoPages,
  resolvePageRange,
  runOcrPdfWithCommand: (input: OcrRunTestInput) => {
    return runOcrPdfWithCommand({ ...input, policy: input.policy ?? POLICY } as OcrRunInput);
  },
  runDenoCommand,
} as const;
