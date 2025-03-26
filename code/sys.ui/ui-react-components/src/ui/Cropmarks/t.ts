import type { t } from './common.ts';

export type CropmarksSize = CropmarksSizeCenter | CropmarksSizeFill;
export type CropmarksSizeMode = CropmarksSize['mode'];

export type CropmarksSizeCenter = {
  mode: 'center';
  width?: number;
  height?: number;
};
export type CropmarksSizeFill = {
  mode: 'fill';
  x: boolean;
  y: boolean;
  margin: t.CssMarginArray;
};

/**
 * <Component>:
 */
export type CropmarksProps = {
  children?: t.ReactNode;
  size?: t.CropmarksSize;
  theme?: t.CommonTheme;
  border?: string;
  style?: t.CssInput;
};
