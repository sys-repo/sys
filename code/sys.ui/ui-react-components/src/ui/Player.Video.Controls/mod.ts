/**
 * @module Video Player Controls
 */
import type { t } from './common.ts';
import { PlayerControls as UI } from './ui.tsx';
import { usePendingSeek } from './use.PendingSeek.ts';

export { usePendingSeek };

export const PlayerControls: t.VideoPlayerControlsLib = {
  UI,
  usePendingSeek,
};
