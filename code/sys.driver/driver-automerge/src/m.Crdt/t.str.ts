/**
 * Represents a single text mutation within a string.
 *
 * @example
 * // Replace 3 characters at index 5 with 'hello'
 * const splice: t.Crdt.Splice = { index: 5, delCount: 3, insertText: 'hello' };
 *
 * @property index     Zero-based position within the string where the change begins.
 * @property delCount  Number of characters to remove starting from `index`.
 * @property insertText Text to insert at that position (may be empty for pure deletion).
 */
export type CrdtStringSplice = {
  index: number;
  delCount: number;
  insertText: string;
};
