import { type t, Breakpoint, rx, SheetBase, Signal, TUBES } from './common.ts';

/**
 * Create a new instance of the application-state signals API.
 */
export const create: t.AppSignalsLib['create'] = (until$) => {
  const s = Signal.create;
  const life = rx.lifecycle(until$);

  /**
   * API:
   */
  type T = t.AppSignals;
  type P = T['props'];
  const props: P = {
    dist: s<t.DistPkg>(),
    stack: s<t.Content[]>([]),
    screen: { breakpoint: s<t.BreakpointName>('UNKNOWN') },
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

  // Finish up.
  return api;
};
