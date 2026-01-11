import type { t } from './common.ts';

/**
 * Component:
 */
export type HarnessProps = {
  decks?: t.TimecodePlaybackDriver.VideoDecks;
  bundle?: t.TimecodePlaybackDriver.Wire.Bundle;
  docid?: t.StringId;

  debug?: boolean;
  layout?: { infopanel?: { bottom?: t.ReactNode } };
  theme?: t.CommonTheme;
  style?: t.CssInput;

  onReady?: (e: { readonly controller: t.TimecodePlaybackDriver.TimelineController }) => void;
  onSnapshot?: (e: { readonly snapshot?: t.TimecodeState.Playback.Snapshot }) => void;
};
