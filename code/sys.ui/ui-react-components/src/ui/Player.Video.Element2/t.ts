import type { t } from './common.ts';

/**
 * <Component>:
 */
export type VideoElement2Props = {
  src?: string;
  poster?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  aspectRatio?: string; // e.g. "16/9"
  borderRadius?: t.Pixels;

  // Apperance:
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;

  // Handlers:
  onEnded?: () => void;
};
