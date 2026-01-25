/**
 * @module
 */
import type { t } from './common.ts';
import { create } from './u.create.ts';
import { VideoDecks as UI } from './ui.tsx';
import { useDecksControls } from './use.DecksControls.tsx';

export const VideoDecks: t.VideoDecksLib = {
  create,
  UI,
  Controls: { useDecksControls },
};
