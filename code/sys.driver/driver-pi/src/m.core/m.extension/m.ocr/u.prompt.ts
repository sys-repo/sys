import { Str, type t } from './common.ts';

/** Convert enabled optical character recognition (OCR) policy into Pi prompt args. */
export function toPromptArgs(policy: t.PiOcrExtension.Policy.Resolved) {
  if (!policy.pdf.enabled) return [] as const;
  return ['--append-system-prompt', formatPrompt(policy)] as const;
}

/**
 * Helpers:
 */
function formatPrompt(policy: t.PiOcrExtension.Policy.Resolved) {
  return Str.dedent(
    `
    # Runtime Tool Contract: ocr_pdf

    The launcher has enabled the wrapper-owned \`ocr_pdf\` tool for optical character recognition (OCR).

    Available additional tool:
    - ocr_pdf: Extract text from scanned or image-based PDF pages through optical character recognition (OCR). No shell commands.

    How to use:
    - Use \`ocr_pdf\` when a PDF's usable text is unavailable, empty, or clearly scanned/image-based.
    - Provide the exact PDF path; use the narrowest page range that can answer the task.
    - Treat OCR output as lossy evidence, not authoritative source text.
    - If output is truncated, say so before relying on missing text.

    Rules:
    - Do not use \`ocr_pdf\` as a general PDF parser, summarizer, or embedded-text extractor.
    - Bash is not an OCR fallback. Do not use \`bash\`, \`pdfinfo\`, \`pdftoppm\`, \`tesseract\`, shell redirection, heredocs, or ad hoc scripts for OCR.
    - If asked to OCR and the callable \`ocr_pdf\` tool is unavailable, STOP and report a launcher/tooling fault. Do not fall back to \`bash\`.
    - If OCR dependencies are missing, report the missing dependency and the launcher-provided install command.
    - The PDF source must exist inside a readable sandbox root.
    - The source must be a regular \`.pdf\` file, not a directory or symlink.
    - Page range, language, DPI, timeout, and output size are bounded by active profile policy.
    - Active OCR policy: languages ${policy.pdf.languages.join(', ')}, default language ${policy.pdf.defaultLanguage}, ${policy.pdf.dpi} DPI, max ${policy.pdf.maxPages} pages, max ${policy.pdf.maxChars} emitted characters, timeout ${policy.pdf.timeoutMs}ms.
    - OCR output may be truncated when it exceeds policy limits; report truncation explicitly.
    - OCR is lossy; report uncertainty when text quality appears poor.
    - The tool refuses protected control/runtime paths.
    `,
  ).trim();
}
