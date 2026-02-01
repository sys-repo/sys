import { type t } from './common.ts';

/** Normalize a CRDT reference into "crdt:<id>" form. */
export function normalizeCrdtRef(input: string): t.StringRef {
  const raw = String(input ?? '').trim();
  if (raw.startsWith('crdt:')) return raw as t.StringRef;
  if (raw.startsWith('urn:crdt:')) return `crdt:${raw.slice('urn:crdt:'.length)}` as t.StringRef;
  return `crdt:${raw}` as t.StringRef;
}
