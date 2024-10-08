import type { t } from '../common.ts';

/**
 * Helpers for working with JavaScript Object Notation (JSON)
 * (RFC-8259).
 */
export type JsonLib = {
  /* Convert to a JSON string. */
  stringify(input: unknown): string;

  /* Convert a JSON string to a JS value. */
  parse<T>(input: t.JsonString | undefined, defaultValue: T | (() => T)): T;
};
