import type { t } from './common.ts';

/**
 * An extended video player.
 */
export type ConceptPlayerProps = {
  debug?: boolean;
  title?: string;
  video?: string;
  timestamps?: t.VideoTimestamps;
  thumbnails?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssValue;
};
