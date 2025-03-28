import type { t } from './common.ts';

/**
 * Global application-state signals API.
 */
export type AppSignals = {
  readonly video: t.VideoPlayerSignals;
  readonly props: {
    readonly dist: t.Signal<t.DistPkg | undefined>;
    readonly breakpoint: t.Signal<t.BreakpointName>;
    readonly background: {
      readonly video: {
        readonly src: t.Signal<string>;
        readonly opacity: t.Signal<number | undefined>;
      };
    };
    readonly stack: t.Signal<t.Content[]>;
  };

  /** API for interacting with the stack. */
  readonly stack: AppSignalsStack;

  /** Hook into all relevant value listeners. */
  listen(): void;
};

/**
 * API for managing the screen stack.
 */
export type AppSignalsStack = {
  /** The number of items in the stack. */
  readonly length: number;

  /** The list of screens. */
  readonly items: t.Content[];

  /** Add a screen to the top of the stack. */
  push(...content: (t.Content | undefined)[]): void;

  /** Remove the highest screen from the stack. */
  pop(): void;

  /** Removes all screens from the stack. */
  clear(): void;
};
