import { type t, VIDEO, Player, Signal } from './common.ts';

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
    theme: s<t.CommonTheme>('Dark'),
    breakpoint: s<t.BreakpointName>('UNKNOWN'),
    content: s<t.AppContent | undefined>(),
    stack: s<t.AppContent[]>([]),
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
    push: (...content) => (props.stack.value = [...props.stack.value, ...content]),
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
      p.theme.value;
      p.content.value;
      p.breakpoint.value;
    },
    load(content) {
      props.content.value = content;
    },
  };

  /**
   * Sync effects:
   */
  Signal.effect(() => {
    const content = props.content.value;
    video.props.src.value = content?.video?.src;
  });

  // Finish up.
  return api;
}
