import { Arr, Num, type t } from '../common.ts';
import { OcrPdfPolicyBounds } from './u.bounds.ts';

type NumericBound = { readonly min: number; readonly max: number };

const DEFAULT_PDF_POLICY: t.PiOcrExtension.Policy.Pdf = {
  enabled: false,
  languages: ['eng'],
  defaultLanguage: 'eng',
  dpi: 200,
  maxPages: 10,
  maxChars: 60_000,
  timeoutMs: 120_000,
};

/** Resolve wrapper-owned optical character recognition (OCR) policy. */
export function policy(
  input: t.PiOcrExtension.Resolve.Policy.Input = {},
): t.PiOcrExtension.Policy.Resolved {
  const pdf = input.pdf;
  const languages = resolveLanguages(pdf?.languages);
  const defaultLanguage = normalizeLanguage(
    'defaultLanguage',
    pdf?.defaultLanguage ?? DEFAULT_PDF_POLICY.defaultLanguage,
  );
  assertLanguageAllowed('defaultLanguage', defaultLanguage, languages);

  return {
    pdf: {
      enabled: pdf?.enabled ?? DEFAULT_PDF_POLICY.enabled,
      languages,
      defaultLanguage,
      dpi: resolveBoundedInt('dpi', pdf?.dpi, DEFAULT_PDF_POLICY.dpi, OcrPdfPolicyBounds.dpi),
      maxPages: resolveBoundedInt(
        'maxPages',
        pdf?.maxPages,
        DEFAULT_PDF_POLICY.maxPages,
        OcrPdfPolicyBounds.maxPages,
      ),
      maxChars: resolveBoundedInt(
        'maxChars',
        pdf?.maxChars,
        DEFAULT_PDF_POLICY.maxChars,
        OcrPdfPolicyBounds.maxChars,
      ),
      timeoutMs: resolveBoundedInt(
        'timeoutMs',
        pdf?.timeoutMs,
        DEFAULT_PDF_POLICY.timeoutMs,
        OcrPdfPolicyBounds.timeoutMs,
      ),
    },
  };
}

/** Resolve the registered tool names enabled by this policy. */
export function toolNames(policy: t.PiOcrExtension.Policy.Resolved): readonly string[] {
  return policy.pdf.enabled ? ['ocr_pdf'] : [];
}

/**
 * Helpers:
 */
function resolveLanguages(input?: readonly string[]) {
  const languages = Arr.uniq(
    (input ?? DEFAULT_PDF_POLICY.languages).map((language) => {
      return normalizeLanguage('language', language);
    }),
  );
  if (languages.length === 0) throw new Error('OCR PDF policy requires at least one language.');
  return languages;
}

function normalizeLanguage(name: string, value: string) {
  const language = value.trim();
  if (language.length > 0) return language;
  throw new Error(`OCR PDF policy ${name} must be a non-empty string.`);
}

function assertLanguageAllowed(name: string, language: string, languages: readonly string[]) {
  if (languages.includes(language)) return;
  throw new Error(`OCR PDF policy ${name} must be one of: ${languages.join(', ')}.`);
}

function resolveBoundedInt(
  name: string,
  value: number | undefined,
  fallback: number,
  bound: NumericBound,
) {
  const resolved = value ?? fallback;
  if (Num.Is.safeInt(resolved) && resolved >= bound.min && resolved <= bound.max) {
    return resolved;
  }
  throw new Error(
    `OCR PDF policy ${name} must be an integer between ${bound.min} and ${bound.max}.`,
  );
}
