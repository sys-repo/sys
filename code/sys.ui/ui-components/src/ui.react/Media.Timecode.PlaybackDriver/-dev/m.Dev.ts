import type { t } from './common.ts';
import { InfoPanel } from './ui/ui.InfoPanel.tsx';

/** Development UI helpers for timecode playback drivers. */
export const Dev: t.TimecodePlaybackDriverDevLib = {
  InfoPanel: { UI: InfoPanel },
};
