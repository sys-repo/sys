import { type t, Style } from './common.ts';

export const Wrangle = {
  componentSize(value?: t.CropmarksSize) {
    let width: number | undefined;
    let height: number | undefined;

    if (!value) return { width, height } as const;
    if (value.mode === 'fill') return { width, height } as const;

    width = value.width;
    height = value.height;
    return { width, height } as const;
  },

  fillMargin(value?: t.CropmarksSize) {
    const DEFAULT = 40;
    if (!value) return Wrangle.asMargin(DEFAULT);
    if (value.mode !== 'fill') return Wrangle.asMargin(DEFAULT);
    return value.margin;
  },

  asMargin(value: number): t.CssMarginArray {
    return Style.Edges.toArray(value ?? 0);
  },
} as const;
