import type { t } from './common.ts';

/** Helpers for recognising, parsing, formatting, and normalising CRDT Ids/URIs. */
export type Lib = {
  /** Extract a CRDT Id from a URI string; returns undefined if not valid. */
  readonly fromUri: (value: string) => t.Crdt.Id | undefined;

  /** Format a CRDT Id as a URI string. */
  readonly toUri: (id: t.Crdt.Id) => string;

  /** Normalise an incoming Id or URI to a bare Id. */
  readonly clean: (value: string) => t.Crdt.Id | undefined;
};
