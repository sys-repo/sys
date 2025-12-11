import type { t } from '../common.ts';

/**
 * Component:
 */
export type MediaTimecodePlaybackProps = {
  debug?: boolean;
  video?: t.VideoPlayerSignals;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
