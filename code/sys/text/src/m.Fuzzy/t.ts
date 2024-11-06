/**
 * Tools for making fuzzy matches on strings.
 */
export type FuzzyLib = {
  /**
   * Generates a pattern-matcher for the given pattern.
   */
  pattern(pattern: string, options?: { maxErrors?: number }): FuzzyMatcher;
};

/**
 * A matcher for a text pattern.
 */
export type FuzzyMatcher = {
  /**
   * The pattern being matches against.
   */
  readonly pattern: string;

  /**
   * Performs a match test on the given string.
   */
  match(input?: string): FuzzyMatchResult;
};

/**
 * The result of a fuzzy match.
 */
export type FuzzyMatchResult = {
  readonly exists: boolean;
  readonly text: string;
  readonly pattern: string;
  readonly matches: FuzzyMatchPosition[];
  readonly range: FuzzyMatchRange;
};

/**
 * The position of a fuzzy match within a string.
 */
export type FuzzyMatchPosition = { start: number; end: number; errors: number };

/**
 * A fuzzy match range within a body of text.
 */
export type FuzzyMatchRange = { start: number; end: number; text: string };
