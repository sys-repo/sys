import type { t } from '../common.ts';

/** Permanent unsupported-node sentinel. Never add this type to production dispatch. */
export const FALLBACK_CANARY_NODE_TYPE = 'proseMarkdownFallbackCanary';

export const fallbackCanary = {
  label: 'sample: permanent fallback canary',
  value: {
    type: 'root',
    children: [
      {
        type: 'heading',
        depth: 3,
        children: [{ type: 'text', value: 'Permanent fallback canary' }],
      },
      {
        type: 'paragraph',
        children: [
          { type: 'text', value: 'Unsupported leaf: ' },
          { type: FALLBACK_CANARY_NODE_TYPE },
        ],
      },
      {
        type: 'paragraph',
        children: [
          { type: 'text', value: 'Unsupported container: ' },
          {
            type: FALLBACK_CANARY_NODE_TYPE,
            children: [{ type: 'text', value: 'child content remains visible.' }],
          },
        ],
      },
    ],
  } as unknown as t.Markdown.Ast,
} as const;
