import type { t } from './common.ts';

/**
 * <Component>:
 */
export type CropmarksProps = {
  debug?: boolean;
  children?: t.ReactNode;
  /** When true cropmarks are abandonded and the subject `children` are rendered only. */
  subjectOnly?: boolean;
  size?: t.CropmarksSize;
  borderWidth?: number;
  borderOpacity?: number;
  borderColor?: string;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * The size configuration of the <Cropmarks>.
 */
export type CropmarksSize = CropmarksSizeCenter | CropmarksSizeFill | CropmarksSizePercent;

/** The display-mode flag for <Cropmarks> size. */
export type CropmarksSizeMode = CropmarksSize['mode'];

/** The subject is centered within the <Cropmaks> host. */
export type CropmarksSizeCenter = {
  mode: 'center';
  width?: number;
  height?: number;
};

/** The subject fills  the <Cropmaks> host. */
export type CropmarksSizeFill = {
  mode: 'fill';
  /** Fills the X (horizontal) plane. */
  x?: boolean;
  /** Fills the Y (vertical) plane. */
  y?: boolean;
  /** Pixel margin around the edge.  */
  margin?: t.CssMarginInput;
};

/**
 * Percent-based sizing of the subject relative to the <Cropmarks> container.
 */
export type CropmarksSizePercent = {
  mode: 'percent';
  /** percentage of container width (0..100). Omit to leave width auto. */
  width?: t.Percent;
  /** percentage of container height (0..100). Omit to leave height auto. */
  height?: t.Percent;
  /** Pixel margin around the edge.  */
  margin?: t.CssMarginInput;
};
