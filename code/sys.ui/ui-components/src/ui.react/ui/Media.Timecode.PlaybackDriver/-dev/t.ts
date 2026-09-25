import type { t } from './common.ts';
import type { InfoPanelProps } from './ui/ui.InfoPanel.tsx';

/**
 * Playback Driver: Dev helpers.
 */
export type TimecodePlaybackDriverDevLib = {
  readonly InfoPanel: { readonly UI: t.FC<InfoPanelProps> };
};
