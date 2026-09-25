import type { JsonSchema } from './t.ts';

export const removeParameters = {
  type: 'object',
  additionalProperties: false,
  required: ['path'],
  properties: {
    path: {
      type: 'string',
      description:
        'File or directory path to remove, relative to cwd or absolute inside the writable sandbox.',
    },
    recursive: {
      type: 'boolean',
      description:
        'Remove a directory tree. Requires active profile policy tools.remove.recursive.',
    },
  },
} as const satisfies JsonSchema;

export const moveParameters = {
  type: 'object',
  additionalProperties: false,
  required: ['from', 'to'],
  properties: {
    from: {
      type: 'string',
      description:
        'Source file or directory path, relative to cwd or absolute inside the writable sandbox.',
    },
    to: {
      type: 'string',
      description:
        'Destination file or directory path, relative to cwd or absolute inside the writable sandbox.',
    },
  },
} as const satisfies JsonSchema;

export const copyParameters = {
  type: 'object',
  additionalProperties: false,
  required: ['from', 'to'],
  properties: {
    from: {
      type: 'string',
      description:
        'Source regular-file path, relative to cwd or absolute inside a readable sandbox root.',
    },
    to: {
      type: 'string',
      description:
        'Destination file path, relative to cwd or absolute inside a writable sandbox root.',
    },
  },
} as const satisfies JsonSchema;
