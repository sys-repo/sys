import type { t } from './common.ts';

/**
 * Component:
 */
export type HarnessProps = {
  video?: t.TimecodePlaybackDriver.VideoDecks;
  bundle?: t.TimecodePlaybackDriver.Wire.Bundle;
  docid?: t.StringId;

  debug?: boolean;
  layout?: { infopanel?: { bottom?: t.ReactNode } };
  theme?: t.CommonTheme;
  style?: t.CssInput;

  onReady?: (e: { readonly controller: t.TimecodePlaybackDriver.TimelineController }) => void;
};
