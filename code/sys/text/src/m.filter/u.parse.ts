import { type t, Is } from './common.ts';

/**
 * Normalize a raw query string into a structured form.
 * - Trims and collapses whitespace.
 * - Splits into space-delimited tokens.
 */
export const parse: t.Filter.ParseFn = (input, _options) => {
  const raw = Is.string(input) ? input : '';
  const text = normalizeWhitespace(raw);
  const tokens = text ? text.split(' ') : [];

  return {
    text,
    tokens: tokens.length > 0 ? tokens : undefined,
  };
};

function normalizeWhitespace(input: string): string {
  return input.trim().replace(/\s+/g, ' ');
}
