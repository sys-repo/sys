import type { t } from '../common.ts';

type JsonInput = t.JsonString | undefined;

/**
 * Helpers for working with JavaScript Object Notation (JSON)
 * (RFC-8259).
 */
export type JsonLib = {
  /** Convert the given input to a serlalized JSON string. */
  stringify(input: unknown, space?: string | number): string;

  /**
   * Parse a JSON string (or return the default/undefined) - throws.
   *
   * Overload 1: `parse<T>(input)` → `T | undefined`
   * Overload 2: `parse<T>(input, default)` → `T`
   */
  parse: {
    <T>(input: JsonInput): T | undefined;
    <T>(input: JsonInput, defaultValue: JsonParseDefault<T>): T;
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
  };
};

/** Default value to use when parsing. */
export type JsonParseDefault<T> = T | (() => T);
/** Response from `Json.safeParse` method. */
export type JsonParseResult<T> = { ok: boolean; data: T; error?: t.StdError };
