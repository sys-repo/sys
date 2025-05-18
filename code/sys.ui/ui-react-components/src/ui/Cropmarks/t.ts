import type { t } from './common.ts';

/**
 * <Component>:
 */
export type CropmarksProps = {
  children?: t.ReactNode;
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
export type CropmarksSize = CropmarksSizeCenter | CropmarksSizeFill;
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
  /** Pixel margin around the  */
  margin: t.CssMarginArray;
  /** Fills the X (horizontal) plane. */
  x: boolean;
  /** Fills the Y (vertical) plane. */
  y: boolean;
};
