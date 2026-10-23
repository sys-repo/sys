import type { t } from './common.ts';

type O = Record<string, unknown>;

/** Represents a single text mutation within a string. */
export type Splice = {
  /** Zero-based position within the string where the change begins. */
  index: number;
  /** Number of characters to remove starting from `index`. */
  delCount: number;
  /** Text to insert at that position; empty string means pure deletion. */
  insertText: string;
};

/** Convert a CRDT-backed value into a plain JS object. */
export type ToObject = <T extends O>(doc?: t.Crdt.Ref<T> | T | unknown) => T;
