import { type t, Breakpoint, Player, rx, SheetBase, Signal, TUBES } from './common.ts';
import { AppPlayer } from './m.Player.ts';

/**
 * Create a new instance of the application-state signals API.
 */
export const create: t.AppSignalsLib['create'] = (until$) => {
  const s = Signal.create;
  const life = rx.lifecycle(until$);
  life.dispose$.subscribe(() => stopSyncing());

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
        src: s<string>(TUBES.src),
        opacity: s<t.Percent | undefined>(0.2),
        playing: s<boolean>(true),
      },
    },
  };

  const stack = SheetBase.Signals.stack(props.stack);
  const api: T = {
    get props() {
      return props;
    },
    get stack() {
      return stack;
    },
    get breakpoint() {
      return Breakpoint.from(props.screen.breakpoint.value);
    },
    listen() {
      const p = props;
      p.stack.value;
      p.dist.value;
      p.screen.breakpoint.value;
      p.background.video.src.value;
      p.background.video.opacity.value;
      p.background.video.playing.value;
    },

    /**
     * Lifecycle:
     */
    dispose: life.dispose,
    get dispose$() {
      return life.dispose$;
    },
    get disposed() {
      return life.disposed;
    },
  };

  /**
   * Sync: VideoPlayers
   */
  const stopSyncing = Signal.effect(() => {
    const stack = props.stack.value;
    const players = props.players;
    const keys = new Set<string>();

    // Add players not yet in the stack:
    stack.forEach((layer, i) => {
      if (layer.video) {
        const key = AppPlayer.key(layer, i);
        keys.add(key);

        if (!players[key]) {
          const src = layer.video.src;
          players[key] = Player.Video.signals({ src });
        }
      }
    });

    // Remove players for layers no longer in the stack:
    Object.keys(players)
      .filter((key) => !keys.has(key))
      .forEach((key) => delete players[key]);
  });

  // Finish up.
  return api;
};
