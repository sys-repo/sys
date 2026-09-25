import type { t } from './common.ts';

/** Helpers for working with strings related to the CRDT namespace. */
export type Lib = {
  /** Extract all `crdt:<id>` references from a string, excluding YAML comments. */
  readonly extractRefs: (text: string) => readonly t.Crdt.Id[];
};
