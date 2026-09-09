import type { t } from './common.ts';
export type * from './t.size.ts';

/**
 * <Component>:
 */
export type CropmarksProps = {
  debug?: boolean;
  children?: t.ReactNode;
  /** When true: cropmarks are abandonded and the subject (`children`) rendered only. */
  subjectOnly?: boolean;
  size?: t.CropmarksSize;
  borderWidth?: number;
  borderOpacity?: number;
  borderColor?: string;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
