import type { t } from './common.ts';

/**
 * Helpers for working with strings related to the CRDT namespace.
 */
export type CrdtStrLib = {
  /**
   * Extract all "crdt:<id>" references from a string,
   * ignoring any that appear inside YAML comments.
   */
  readonly extractRefs: (text: string) => readonly t.Crdt.Id[];
};
