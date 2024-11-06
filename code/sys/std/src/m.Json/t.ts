import type { t } from '../common.ts';

/**
 * Helpers for working with JavaScript Object Notation (JSON)
 * (RFC-8259).
 */
export type JsonLib = {
  /** Convert the given input to a serlalized JSON string. */
  stringify(input: unknown, space?: string | number): string;

  /** Inflate a serialized JSON string to a JS object. */
  parse<T>(input: t.JsonString | undefined, defaultValue: T | (() => T)): T;
};
