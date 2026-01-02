import type { t } from './common.ts';

/**
 * Component:
 */
export type HarnessProps = {
  debug?: boolean;
  video?: { A: t.VideoPlayerSignals; B: t.VideoPlayerSignals };
  bundle?: t.TimecodeDriver.Wire.Bundle;
  docid?: t.StringId;
  layout?: { infopanel?: { bottom?: t.ReactNode } };
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onReady?: (e: { readonly controller: t.TimelineController }) => void;
};
