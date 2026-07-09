import type { t } from './common.ts';

/**
 * Wrapper-owned optical character recognition (OCR) Pi extension.
 */
export declare namespace PiOcrExtension {
  /** Runtime surface for the optical character recognition (OCR) extension. */
  export type Lib = {
    /** Resolve effective optical character recognition (OCR) policy from profile policy. */
    resolvePolicy(input?: ResolvePolicyInput): Policy;
    /** Convert enabled optical character recognition (OCR) policy to Pi prompt args. */
    toPromptArgs(policy: Policy): readonly string[];
  };

  /** Inputs required to resolve optical character recognition (OCR) policy. */
  export type ResolvePolicyInput = {
    /** Profile-authored PDF OCR policy. */
    readonly pdf?: t.PiCliProfiles.Tools.OcrPdf;
  };

  /** Resolved optical character recognition (OCR) policy. */
  export type Policy = {
    /** Resolved PDF OCR policy. */
    readonly pdf: PdfPolicy;
  };

  /** Resolved PDF optical character recognition (OCR) policy. */
  export type PdfPolicy = {
    /** Whether the `ocr_pdf` tool is enabled for this launch. */
    readonly enabled: boolean;
    /** Allowed OCR language codes. */
    readonly languages: readonly string[];
    /** Language used when a tool call omits `language`. */
    readonly defaultLanguage: string;
    /** Fixed render DPI for this profile, bounded to 72..600. */
    readonly dpi: number;
    /** Maximum pages processed by one tool call, bounded to 1..100. */
    readonly maxPages: number;
    /** Maximum emitted OCR characters, bounded to 1..1,000,000. */
    readonly maxChars: number;
    /** Total command budget for one tool call, bounded to 1,000..600,000ms. */
    readonly timeoutMs: number;
  };
}
