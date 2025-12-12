import type { t } from './common.ts';

/**
 * Component:
 */
export type MediaTimelineHarnessProps = {
  debug?: boolean;
  video?: t.VideoPlayerSignals;
  docid?: t.StringId;
  bundle?: t.SpecTimelineBundle;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
