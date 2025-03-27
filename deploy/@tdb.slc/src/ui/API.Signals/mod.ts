/**
 * @module
 */
import { type t, Player, Signal } from './common.ts';

export function createSignals() {
  const s = Signal.create;

  const video = Player.Video.signals({
    src: 'vimeo/1068502644', // Rowan: Trailer (Public).
  });

  type T = t.SlcSignals;
  const api: T = {
    stage: s<t.Stage>('Entry'),
    dist: s<t.DistPkg>(),
    get video() {
      return video;
    },

    listen() {
      api.stage.value;
      api.dist.value;
      api.video.props.playing.value;
    },
  };

  return api;
}
