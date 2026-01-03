import type { t } from './common.ts';

/**
 * Component:
 */
export type HarnessProps = {
  video?: { A: t.VideoPlayerSignals; B: t.VideoPlayerSignals };
  bundle?: t.TimecodePlaybackDriver.Wire.Bundle;
  docid?: t.StringId;

  debug?: boolean;
  layout?: { infopanel?: { bottom?: t.ReactNode } };
  theme?: t.CommonTheme;
  style?: t.CssInput;

  onReady?: (e: { readonly controller: t.TimecodePlaybackDriver.TimelineController }) => void;
};
