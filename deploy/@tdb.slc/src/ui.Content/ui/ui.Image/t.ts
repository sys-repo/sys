import type { t } from './common.ts';

/**
 * Image content render library.
 */
export type ImageLib = {
  View: React.FC<t.ImageViewProps>;
};

/**
 * <Component>:
 */
export type ImageViewProps = {
  src?: string;
  alt?: string;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
