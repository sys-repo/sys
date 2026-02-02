import type { t } from './common.ts';

type Snapshot = t.TimecodeState.Playback.Snapshot;
type Controller = t.TimecodePlaybackDriver.TimelineController;

/**
 * Component:
 */
export type HarnessProps = {
  decks?: t.TimecodePlaybackDriver.VideoDecks;
  bundle?: t.TimecodePlaybackDriver.Wire.Bundle;
  docid?: t.StringId;
  url?: t.StringUrl;

  debug?: boolean;
  layout?: { infopanel?: { bottom?: t.ReactNode } };
  theme?: t.CommonTheme;
  style?: t.CssInput;

  onReady?: (e: { readonly controller: Controller }) => void;
  onSnapshot?: (e: { readonly snapshot?: Snapshot }) => void;
};
