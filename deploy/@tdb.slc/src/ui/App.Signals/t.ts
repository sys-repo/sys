import type { t } from './common.ts';

/**
 * Global application-state signals API.
 */
export type AppSignals = {
  video: t.VideoPlayerSignals;
  props: {
    dist: t.Signal<t.DistPkg | undefined>;
    theme: t.Signal<t.CommonTheme>;
    breakpoint: t.Signal<t.BreakpointName>;
    content: t.Signal<t.AppContent | undefined>;
    background: {
      video: {
        src: t.Signal<string>;
        opacity: t.Signal<number | undefined>;
      };
    };
  };

  /** Hook into all relevant value listeners. */
  listen(): void;

  /** Load the given content into the model. */
  load(content?: t.AppContent): void;
};
