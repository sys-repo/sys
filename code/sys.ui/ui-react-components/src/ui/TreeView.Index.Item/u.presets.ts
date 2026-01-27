import { type t, D } from './common.ts';

export const Presets: t.IndexTreeViewPreset = {
  Padding: {
    spacious: [20, 12, 20, 20],
    default: D.padding,
    compact: [10, 6, 8, 10],
    tight: [5, 5, 5, 10],
  },
} as const;
