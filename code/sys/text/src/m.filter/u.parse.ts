import { type t } from './common.ts';

/**
 * Normalize a raw query string into a structured form.
 * - Trims and collapses whitespace.
 * - Splits into space-delimited tokens.
 */
export const parse: t.TextFilter.ParseFn = (input, _options) => {
  const text = normalizeWhitespace(input);
  const tokens = text ? text.split(' ') : undefined;
  return { text, tokens };
};

function normalizeWhitespace(input: string): string {
  return input.trim().replace(/\s+/g, ' ');
}
