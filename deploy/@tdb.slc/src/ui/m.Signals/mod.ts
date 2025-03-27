/**
 * @module
 */
import { type t, Player, Signal } from './common.ts';

export function createSignals() {
  const s = Signal.create;

  const video = Player.Video.signals({
    src: 'vimeo/1068502644', // Trailer
  });

  const api: t.SlcSignals = {
    stage: s<t.Stage>('Entry'),
    video,
  };
  return api;
}
