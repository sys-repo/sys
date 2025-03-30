import { Player, Signal, type t, VIDEO } from './common.ts';
import { createStack } from './m.Signals.stack.ts';

/**
 * Create a new instance of the application-state signals API.
 */
export function createSignals() {
  const s = Signal.create;
  const video = Player.Video.signals({});

  /**
   * API:
   */
  type T = t.AppSignals;
  type P = T['props'];
  const props: P = {
    dist: s<t.DistPkg>(),
    stack: s<t.Content[]>([]),
    screen: { breakpoint: s<t.BreakpointName>('UNKNOWN') },
    players: {},
    background: {
      video: {
        src: s<string>(VIDEO.Tubes.src),
        opacity: s<t.Percent | undefined>(0.2),
      },
    },
  };

  const stack = createStack(props.stack);
  const api: T = {
    get props() {
      return props;
    },
    get video() {
      return video;
    },
    get stack() {
      return stack;
    },
    listen() {
      const p = props;
      video.props.playing.value;
      p.stack.value;
      p.dist.value;
      p.screen.breakpoint.value;
      p.background.video.opacity.value;
    },
  };

  /**
   * Sync: VideoPlayers
   */
  Signal.effect(() => {
    const stack = props.stack.value;
    const players = props.players;
    const keys = new Set<string>();

    // Add players not yet in the stack:
    stack.forEach((layer, i) => {
      if (layer.video) {
        const key = `${layer.id}.${i}`;
        keys.add(key);

        if (!players[key]) {
          const src = layer.video.src;
          players[key] = Player.Video.signals({ src });
        }
      }

      // Remove players for layers no longer in the stack:
      Object.keys(players)
        .filter((key) => !keys.has(key))
        .forEach((key) => delete players[key]);
    });
  });

  // Finish up.
  return api;
}
