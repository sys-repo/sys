import type * as t from './t.ts';

export const CanvasPanel = {
  get list(): t.CanvasPanel[] {
    return [
      'purpose',
      'impact',
      'problem',
      'solution',
      'metrics',
      'uvp',
      'advantage',
      'channels',
      'customers',
      'costs',
      'revenue',
    ];
  },
} as const;
