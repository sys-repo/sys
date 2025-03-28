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
    breakpoint: s<t.BreakpointName>('UNKNOWN'),
    stack: s<t.Content[]>([]),
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
    pop: () => (props.stack.value = props.stack.value.slice(0, -1)),
    clear: () => (props.stack.value = []),
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
      p.background.video.opacity.value;
      p.dist.value;
      p.breakpoint.value;
      p.stack.value;
    },
  };

  /**
   * Sync effects:
   */
  Signal.effect(() => {});

  // Finish up.
  return api;
}
