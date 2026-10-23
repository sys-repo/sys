/** Hard resource bounds for PDF optical character recognition (OCR) policy. */
export const OcrPdfPolicyBounds = {
  dpi: { min: 72, max: 600 },
  maxPages: { min: 1, max: 100 },
  maxChars: { min: 1, max: 1_000_000 },
  timeoutMs: { min: 1_000, max: 600_000 },
} as const;
