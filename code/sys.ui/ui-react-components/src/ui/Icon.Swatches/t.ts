import type { t } from './common.ts';

/**
 * Component:
 */
export type IconSwatchesProps = {
  /** Smallest cell size in px (default ~90). */
  minSize?: number;

  /** Largest cell size in px (default ~320). */
  maxSize?: number;

  /** Normalized slider position (0..1) representing the size of each icon. */
  percent?: number;

  // Appearance:
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;

  onSizeChange?: t.IconSwatchesChangeHandler;
};

/** Callback when percent changes (0..1). */
export type IconSwatchesChangeHandler = (e: IconSwatchesChange) => void;
export type IconSwatchesChange = {
  readonly pixels: t.Pixels;
  readonly percent: t.Percent;
};
