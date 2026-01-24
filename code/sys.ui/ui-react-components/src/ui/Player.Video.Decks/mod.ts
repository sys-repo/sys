/**
 * @module
 */
import type { t } from './common.ts';
import { create } from './u.create.ts';
import { VideoDecks as UI } from './ui.tsx';

export const VideoDecks: t.VideoDecksLib = {
  UI,
  create,
};
