import { type t, Player, Signal } from './common.ts';
import { VIDEO } from './VIDEO.index.ts';

/**
 * Create a new instance of the application-state signals API.
 */
export function createSignals() {
  const s = Signal.create;

  const video = Player.Video.signals({
    src: VIDEO.Trailer.src, // Rowan: Trailer (Public).
  });

  type T = t.AppSignals;
  const api: T = {
    get video() {
      return video;
    },

    stage: s<t.Stage>('Entry'),
    dist: s<t.DistPkg>(),
    theme: s<t.CommonTheme>('Dark'),

    background: {
      video: {
        opacity: s<t.Percent | undefined>(0.2),
      },
    },

    listen() {
      api.stage.value;
      api.dist.value;
      api.theme.value;
      api.video.props.playing.value;
      api.background.video.opacity.value;
    },
  };

  return api;
}
