import type { t } from './common.ts';

/**
 * Component:
 */
export type YouTubeProps = {
  videoId?: string;
  width?: number;
  height?: number;

  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
