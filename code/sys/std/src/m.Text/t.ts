import type { t } from './common.ts';

/**
 * Library: helpers for working on strings of text.
 */
export type TextLib = {
  /* Calculate a difference between two strings. */
  diff: t.TextDiffCalc;

  /* Safely modify a string stored on an immutable object <T>. */
  splice: t.TextSplice;

  /* Replace all of a string using splice. */
  replace: t.TextReplace;

  /* Limit the length of a string inserting ellipsis when needed. */
  shorten(input?: string, maxLength?: number, options?: { ellipsis?: string }): string;

  /* Capitalize the given word. */
  capitalize(word: string): string;
};
