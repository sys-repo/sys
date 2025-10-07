import type { t } from './common.ts';

/**
 * Namespace: <IconSwatches>
 *
 * UI component for rendering a resizable grid of icon swatches.
 * - Wraps a known subset of `Icons` with the system's <Icon> renderer.
 * - Provides a `View` component for direct use in UIs and dev-harnesses.
 */
export type IconSwatchesLib = {
  readonly View: React.FC<t.IconSwatchesProps>;
  readonly Walk: t.IconWalkHelper;
  /** Walk an object index of icons. */
  walk: t.IconWalkHelper['icons'];
  readonly Size: t.IconSizeHelper;
};

/**
 * Component:
 */
export type IconSwatchesProps = {
  // List:
  items?: t.IconSwatchItem[];
  selected?: t.ObjectPath;

  /** Smallest cell size in px. */
  minSize?: number;
  /** Largest cell size in px. */
  maxSize?: number;
  /** Normalized slider position (0..1) representing the size of each icon. */
  percent?: number;

  // Appearance:
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;

  // Events:
  onSizeChange?: t.IconSwatchesSizeHandler;
  onSelect?: t.IconSwatchesSelectHandler;
};

/**
 * A single swatch item.
 */
export type IconSwatchItem = [t.ObjectPath, t.IconRenderer];

/**
 * Icon tree walking helpers.
 */
export type IconWalkHelper = {
  /** Walk an object index of icons. */
  icons(obj: unknown): t.IconSwatchItem[];
};

/**
 * Icon sizing helpers.
 */
export type IconSizeHelper = {
  /**
   * Clamp the given slider percent (0..1) and resolve it to both
   * - the normalized percent, and
   * - the corresponding pixel size within the given [min,max] range.
   *
   * Useful as the single source of truth when converting a slider position
   * into concrete swatch cell dimensions.
   */
  normalize(percent: t.Percent, range: t.MinMaxNumberRange): IconSwatchesSize;
  /**
   * Given a slider percent (0..1) and a [min,max] range,
   * return the pixel size (rounded).
   */
  toPixels(percent: t.Percent, range: t.MinMaxNumberRange): t.Pixels;
  /**
   * Given a pixel size and a [min,max] range,
   * return the normalized slider percent (0..1).
   */
  toPercent(pixels: t.Pixels, range: t.MinMaxNumberRange): t.Percent;
};

/**
 * EVENTS:
 */

/** Callback when percent changes (0..1). */
export type IconSwatchesSizeHandler = (e: IconSwatchesSize) => void;
export type IconSwatchesSize = {
  readonly pixels: t.Pixels;
  readonly percent: t.Percent;
};

/** Selection change callbcak. */
export type IconSwatchesSelectHandler = (e: IconSwatchesSelect) => void;
export type IconSwatchesSelect = { readonly path: t.ObjectPath };
