import { type t, Player, Signal } from './common.ts';

/**
 * Create a new instance of the application-state signals API.
 */
export function createSignals() {
  const s = Signal.create;

  const video = Player.Video.signals({
    src: 'vimeo/1068502644', // Rowan: Trailer (Public).
  });

  type T = t.AppSignals;
  const api: T = {
    get video() {
      return video;
    },

    stage: s<t.Stage>('Entry'),
    dist: s<t.DistPkg>(),
    theme: s<t.CommonTheme>('Dark'),

    listen() {
      api.stage.value;
      api.dist.value;
      api.theme.value;
      api.video.props.playing.value;
    },
  };

  return api;
}
