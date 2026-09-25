import { type t, D, Style } from './common.ts';

export function toComponentSize(value?: t.CropmarksSize) {
  let width: number | undefined;
  let height: number | undefined;

  if (!value) return { width, height } as const;
  if (value.mode !== 'center') return { width, height } as const;

  width = value.width;
  height = value.height;
  return { width, height } as const;
}

export function toFillMargin(value?: t.CropmarksSize): t.CssMarginArray {
  const DEFAULT = D.margin;
  if (!value) return asMargin(DEFAULT);
  if (value.mode !== 'fill' && value.mode !== 'percent') return asMargin(DEFAULT);
  return value.margin == null ? asMargin(DEFAULT) : Style.Edges.toArray(value.margin);
}

export function asMargin(value: number): t.CssMarginArray {
  return Style.Edges.toArray(value ?? 0);
}
