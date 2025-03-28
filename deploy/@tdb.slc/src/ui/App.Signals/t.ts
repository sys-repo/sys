import type { t } from './common.ts';

/**
 * Global application-state signals API.
 */
export type AppSignals = {
  readonly video: t.VideoPlayerSignals;
  readonly props: {
    readonly dist: t.Signal<t.DistPkg | undefined>;
    readonly theme: t.Signal<t.CommonTheme>;
    readonly breakpoint: t.Signal<t.BreakpointName>;
    readonly background: {
      readonly video: {
        readonly src: t.Signal<string>;
        readonly opacity: t.Signal<number | undefined>;
      };
    };
    readonly content: t.Signal<t.AppContent | undefined>; // TEMP 🐷
    readonly stack: t.Signal<t.AppContent[]>;
  };
  readonly stack: AppSignalsStack;

  /** Hook into all relevant value listeners. */
  listen(): void;

  /** Load the given content into the model. */
  load(content?: t.AppContent): void;
};

/**
 * API for managing the screen stack.
 */
export type AppSignalsStack = {
  readonly length: number;
  /** Add a screen to the top of the stack. */
  push(...content: t.AppContent[]): void;

  /** Remove the highest screen from the stack. */
  pop(): void;

  /** Removes all screens from the stack. */
  clear(): void;
};
