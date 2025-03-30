import type { t } from './common.ts';

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
