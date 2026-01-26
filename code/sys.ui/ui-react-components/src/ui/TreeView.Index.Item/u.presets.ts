import { type t, D } from './common.ts';

export const Presets = {
  Padding: {
    spacious: [20, 12, 20, 20] satisfies t.CssPaddingInput,
    default: D.padding,
    compact: [10, 6, 8, 10] satisfies t.CssPaddingInput,
    tight: [5, 5, 5, 10] satisfies t.CssPaddingInput,
  },
} as const;
