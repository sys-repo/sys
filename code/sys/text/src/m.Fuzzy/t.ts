/**
 * Tools for making fuzzy matches on strings.
 */
export type FuzzyLib = {
  pattern: FuzzyMatcher;
};

export type FuzzyMatcher = (
  pattern: string,
  options?: { maxErrors?: number },
) => {
  match(input: string | undefined): FuzzyMatchResult;
};

export type FuzzyMatchResult = {
  readonly exists: boolean;
  readonly text: string;
  readonly pattern: string;
  readonly matches: FuzzyMatchPosition[];
  readonly range: FuzzyMatchRange;
};

export type FuzzyMatchPosition = { start: number; end: number; errors: number };
export type FuzzyMatchRange = { start: number; end: number; text: string };
