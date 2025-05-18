import type * as t from './t.ts';
import { asArray } from './libs.ts';

type P = t.CanvasPanel;

const list: P[] = [
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

export const CanvasPanel = {
  /**
   * All canvas panels, in order.
   */
  list,

  /**
   * Merge a set of canvas panels values together.
   * Gaurantees uniqueness and no nulls.
   */
  merge(a?: P | P[], b?: P | P[]): P[] {
    return [...new Set([...asArray(a), ...asArray(b)].filter(Boolean))] as P[];
  },
} as const;
