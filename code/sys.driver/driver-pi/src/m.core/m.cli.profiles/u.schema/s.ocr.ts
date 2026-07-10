import { OcrPdfPolicyBounds } from '../../m.extension/m.ocr/u/u.bounds.ts';
import { Type } from './common.ts';

/** Profile OCR schema fragment. */
export const ocr = Type.Optional(
  Type.Object(
    {
      pdf: Type.Optional(
        Type.Object(
          {
            enabled: Type.Optional(Type.Boolean()),
            languages: Type.Optional(Type.Array(Type.String({ minLength: 1 }), { minItems: 1 })),
            defaultLanguage: Type.Optional(Type.String({ minLength: 1 })),
            dpi: Type.Optional(Type.Integer(toJsonSchemaRange(OcrPdfPolicyBounds.dpi))),
            maxPages: Type.Optional(Type.Integer(toJsonSchemaRange(OcrPdfPolicyBounds.maxPages))),
            maxChars: Type.Optional(Type.Integer(toJsonSchemaRange(OcrPdfPolicyBounds.maxChars))),
            timeoutMs: Type.Optional(Type.Integer(toJsonSchemaRange(OcrPdfPolicyBounds.timeoutMs))),
          },
          { additionalProperties: false },
        ),
      ),
    },
    { additionalProperties: false },
  ),
);

/**
 * Helpers:
 */
function toJsonSchemaRange(bound: { readonly min: number; readonly max: number }) {
  return { minimum: bound.min, maximum: bound.max };
}
