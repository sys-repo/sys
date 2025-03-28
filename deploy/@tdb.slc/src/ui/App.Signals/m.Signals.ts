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
  type P = T['props'];

  const props: P = {
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
  };

  const api: T = {
    props,
    listen() {
      const p = props;
      p.video.props.playing.value;
      p.background.video.opacity.value;
      p.stage.value;
      p.dist.value;
      p.theme.value;
    },
  };

  return api;
}
