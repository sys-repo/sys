import type { t } from './common.ts';

/**
 * Component:
 */
export type MediaTimelineHarnessProps = {
  debug?: boolean;
  video?: t.VideoPlayerSignals;
  docid?: t.StringId;
  bundle?: t.SpecTimelineBundle;

  layout?: {
    infopanel?: {
      bottom?: t.ReactNode;
    };
  };

  theme?: t.CommonTheme;
  style?: t.CssInput;
};
