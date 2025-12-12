import type { t } from './common.ts';

/**
 * Component:
 */
export type MediaTimelineHarnessProps = {
  debug?: boolean;
  video?: t.VideoPlayerSignals;
  bundle?: t.SpecTimelineBundle;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
