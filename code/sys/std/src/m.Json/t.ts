import type { t } from '../common.ts';

type JsonInput = t.JsonString | undefined;

/**
 * Helpers for working with JavaScript Object Notation (JSON)
 * (RFC-8259).
 */
export type JsonLib = {
  /** Convert the given input to a serlalized JSON string. */
  stringify(input: unknown, space?: string | number): string;

  /** Inflate a serialized JSON string to a JS object (throws on error). */
  parse<T>(input: JsonInput, defaultValue: JsonParseDefault<T>): T;

  /** Parse JSON with error response. */
  safeParse<T>(input: JsonInput, defaultValue: JsonParseDefault<T>): JsonParseResult<T>;
};

/** Default value to use when parsing. */
export type JsonParseDefault<T> = T | (() => T);
/** Response from `Json.safeParse` method. */
export type JsonParseResult<T> = { ok: true; data?: T; error?: t.StdError };
