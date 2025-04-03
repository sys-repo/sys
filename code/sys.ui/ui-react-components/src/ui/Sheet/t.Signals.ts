import type { t } from './common.ts';

/**
 * Library: Sheet Signals (State).
 */
export type SheetSignalsLib = {
  /** Factory: create a new stack API. */
  stack<T>(signal?: t.Signal<T[]>): t.SheetSignalStack<T>;
};

/**
 * API for managing the stack of sheets.
 */
export type SheetSignalStack<T> = {
  /** The number of items in the stack. */
  readonly length: number;

  /** The list of screens. */
  readonly items: T[];

  /** Add a screen to the top of the stack. */
  push(...content: (T | undefined)[]): void;

  /** Remove the highest screen from the stack. */
  pop(leave?: number): void;

  /** Removes all screens from the stack. */
  clear(leave?: number): void;

  /** Extract the underlying signal. */
  toSignal(): t.Signal<T[]>;
};
