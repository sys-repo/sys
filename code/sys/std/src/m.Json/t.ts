import type { t } from '../common.ts';

type JsonInput = t.JsonString | undefined;
type JsonParseOptions = { jsonc?: boolean };

/**
 * Helpers for working with JavaScript Object Notation (JSON)
 * (RFC-8259).
 */
export type JsonLib = {
  /** Convert the given input to a serlalized JSON string. */
  stringify(input: unknown, space?: string | number, circularTag?: string): string;

  /**
   * Parse a JSON string (or return the default/undefined) - throws.
   *
   * Overload 1: `parse<T>(input)` → `T | undefined`
   * Overload 2: `parse<T>(input, default)` → `T`
   */
  parse: {
    <T>(input: JsonInput): T | undefined;
    <T>(input: JsonInput, defaultValue: JsonParseDefault<T>): T;
    <T>(input: JsonInput, defaultValue: JsonParseDefault<T>, options: JsonParseOptions): T;
  };

  /**
   * Parse with error capture.
   *
   * Overload 1: `safeParse<T>(input)` → `{ ok: true; data: T | undefined } | { ok: false; error }`
   * Overload 2: `safeParse<T>(input, default)` → `{ ok: true; data: T } | { ok: false; error }`
   */
  safeParse: {
    <T>(input: JsonInput): JsonParseResult<T | undefined>;
    <T>(input: JsonInput, defaultValue: JsonParseDefault<T>): JsonParseResult<T>;
    <T>(input: JsonInput, defaultValue: JsonParseDefault<T>, options: JsonParseOptions): JsonParseResult<T>;
  };

  /** Factory for a replacer that elides circular refs as a tag. */
  circularReplacer(tag?: string): (key: string, value: unknown) => unknown;
};

/** Default value to use when parsing. */
export type JsonParseDefault<T> = T | (() => T);
/** Response from `Json.safeParse` method. */
export type JsonParseResult<T> = { ok: boolean; data: T; error?: t.StdError };
