import { type t } from './common.ts';

/**
 * Character offset range within the YAML source.
 * - `[start, end)` — normalized editor/diagnostic span.
 * - `[start, valueEnd, nodeEnd]` — full YAML AST span.
 */
export type YamlRange = readonly [number, number] | readonly [number, number, number];

/**
 * Helpers for converting byte/character ranges to line/column positions.
 */
export type YamlRangeLib = {
  /**
   * Convert a character-offset range within `text` into 1-based line/column coords.
   * Accepts either a 2-tuple or 3-tuple range; the first two numbers are used.
   *
   * @returns A pair `[from, to]` where each is `{ line, col }` (1-based).
   *          `end` is treated as exclusive in the input range.
   */
  toLinePos(text: string, range: t.YamlRange): t.YamlLinePosPair;
};
