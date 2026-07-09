import { Schema, type t, Yaml } from './common.ts';
import { OcrPdfPolicyBounds } from '../m.extension/m.ocr/u.bounds.ts';

const Type = Schema.Type;

/**
 * Profile config YAML schema.
 */
export const ProfileSchema = {
  initial(): t.PiCliProfiles.Yaml.Profile {
    return {
      sandbox: {
        capability: { read: [], write: [], env: {} },
        context: { append: [] },
      },
      tools: {
        remove: { enabled: true, recursive: true },
        move: { enabled: true },
        copy: { enabled: true },
        ocr: {
          pdf: {
            enabled: false,
            languages: ['eng'],
            defaultLanguage: 'eng',
            dpi: 200,
            maxPages: 10,
            maxChars: 60_000,
            timeoutMs: 120_000,
          },
        },
      },
    };
  },

  validate(value: unknown) {
    const ok = Schema.Value.Check(ProfileSchema.schema, value);
    const errors = ok ? [] : [...Schema.Value.Errors(ProfileSchema.schema, value)];
    return { ok, errors } as const;
  },

  stringify(doc: t.PiCliProfiles.Yaml.Profile): string {
    const res = Yaml.stringify(doc);
    if (res.error || !res.data) return '';
    return res.data;
  },

  schema: Type.Object(
    {
      prompt: Type.Optional(
        Type.Object(
          { system: Type.Optional(Type.Union([Type.String({ minLength: 1 }), Type.Null()])) },
          { additionalProperties: false },
        ),
      ),
      sandbox: Type.Optional(
        Type.Object(
          {
            capability: Type.Optional(
              Type.Object(
                {
                  read: Type.Optional(Type.Array(Type.String())),
                  write: Type.Optional(Type.Array(Type.String())),
                  env: Type.Optional(Type.Record(Type.String(), Type.String())),
                },
                { additionalProperties: false },
              ),
            ),
            context: Type.Optional(
              Type.Object(
                { append: Type.Optional(Type.Array(Type.String())) },
                { additionalProperties: false },
              ),
            ),
          },
          { additionalProperties: false },
        ),
      ),
      tools: Type.Optional(
        Type.Object(
          {
            remove: Type.Optional(
              Type.Object(
                {
                  enabled: Type.Optional(Type.Boolean()),
                  recursive: Type.Optional(Type.Boolean()),
                },
                { additionalProperties: false },
              ),
            ),
            move: Type.Optional(
              Type.Object(
                { enabled: Type.Optional(Type.Boolean()) },
                { additionalProperties: false },
              ),
            ),
            copy: Type.Optional(
              Type.Object(
                { enabled: Type.Optional(Type.Boolean()) },
                { additionalProperties: false },
              ),
            ),
            ocr: Type.Optional(
              Type.Object(
                {
                  pdf: Type.Optional(
                    Type.Object(
                      {
                        enabled: Type.Optional(Type.Boolean()),
                        languages: Type.Optional(
                          Type.Array(Type.String({ minLength: 1 }), { minItems: 1 }),
                        ),
                        defaultLanguage: Type.Optional(Type.String({ minLength: 1 })),
                        dpi: Type.Optional(Type.Integer(toJsonSchemaRange(OcrPdfPolicyBounds.dpi))),
                        maxPages: Type.Optional(
                          Type.Integer(toJsonSchemaRange(OcrPdfPolicyBounds.maxPages)),
                        ),
                        maxChars: Type.Optional(
                          Type.Integer(toJsonSchemaRange(OcrPdfPolicyBounds.maxChars)),
                        ),
                        timeoutMs: Type.Optional(
                          Type.Integer(toJsonSchemaRange(OcrPdfPolicyBounds.timeoutMs)),
                        ),
                      },
                      { additionalProperties: false },
                    ),
                  ),
                },
                { additionalProperties: false },
              ),
            ),
          },
          { additionalProperties: false },
        ),
      ),
    },
    { additionalProperties: false },
  ),
} as const;

/**
 * Helpers:
 */
function toJsonSchemaRange(bound: { readonly min: number; readonly max: number }) {
  return { minimum: bound.min, maximum: bound.max };
}
