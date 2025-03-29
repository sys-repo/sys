import { Player, Signal, type t, VIDEO } from './common.ts';

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
    background: {
      video: {
        src: s<string>(VIDEO.Tubes.src),
        opacity: s<t.Percent | undefined>(0.2),
      },
    },
  };

  const stack: t.AppSignalsStack = {
    get length() {
      return props.stack.value.length;
    },
    get items() {
      return [...props.stack.value];
    },
    push(...content) {
      const next = [...props.stack.value, ...content].filter(Boolean);
      props.stack.value = next as t.Content[];
    },
    pop(leave = 0) {
      const stack = props.stack;
      if (stack.value.length > leave) stack.value = stack.value.slice(0, -1);
    },
    clear(leave = 0) {
      props.stack.value = props.stack.value.slice(0, leave);
    },
  };

  const api: T = {
    get props() {
      return props;
    },
    get video() {
      return video;
    },
    stack,
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
   * Sync effects:
   */
  Signal.effect(() => {});

  // Finish up.
  return api;
}
