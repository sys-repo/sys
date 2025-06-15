import type { t } from './common.ts';

/**
 * History tools.
 */
export type HistoryLib = {
  stack(options?: { max?: number; items?: string[] }): HistoryStack;
};

/**
 * An up ↔ down history ring.
 * Newest item is always index 0.
 */
export type HistoryStack = {
  /**
   * Read-only snapshot (newest → oldest).
   */
  readonly items: readonly string[];

  /**
   * Pushes a new line (ignores blanks, de-dupes, enforces `max`).
   */
  push(line: string): void;

  /**
   * "Up arrow" → older entry (sticks on oldest).
   * @param current pass current value to recursively step past it.
   */
  back(current?: string): string | undefined;

  /**
   * "Down arrow" → newer entry (drops to live prompt when past newest).
   */
  forward(): string | undefined;
};
