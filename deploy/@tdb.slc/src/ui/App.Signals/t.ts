import type { t } from './common.ts';

/**
 * Global application-state signals API.
 */
export type AppSignals = {
  readonly video: t.VideoPlayerSignals;
  readonly props: {
    readonly stack: t.Signal<t.Content[]>;
    readonly dist: t.Signal<t.DistPkg | undefined>;
    readonly screen: { readonly breakpoint: t.Signal<t.BreakpointName> };
    readonly background: {
      readonly video: {
        readonly src: t.Signal<string>;
        readonly opacity: t.Signal<number | undefined>;
      };
    };
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
  pop(leave?: number): void;

  /** Removes all screens from the stack. */
  clear(leave?: number): void;
};
