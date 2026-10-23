import type { JsonSchema } from './t.ts';

export const ocrPdfParameters = {
  type: 'object',
  additionalProperties: false,
  required: ['path'],
  properties: {
    path: {
      type: 'string',
      description:
        'Readable PDF path to OCR, relative to cwd or absolute inside a configured readable sandbox root.',
    },
    pageStart: {
      type: 'integer',
      minimum: 1,
      description: 'First 1-based page to OCR. Defaults to 1.',
    },
    pageEnd: {
      type: 'integer',
      minimum: 1,
      description:
        'Last 1-based page to OCR. Defaults to the bounded page window allowed by policy.',
    },
    language: {
      type: 'string',
      description: 'OCR language code. Must be one of the active OCR policy languages.',
    },
  },
} as const satisfies JsonSchema;
