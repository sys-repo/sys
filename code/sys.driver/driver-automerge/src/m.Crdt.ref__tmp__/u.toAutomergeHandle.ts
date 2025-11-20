import type { t } from './common.ts';

type O = Record<string, unknown>;
export const REF = Symbol('ref:handle');

/**
 * Extract the hidden handle from a [CrdtRef] document.
 */
export function toAutomergeHandle<T extends O>(doc?: t.CrdtRef<T>): t.DocHandle<T> | undefined {
  if (!doc) return;
  return (doc as any)[REF];
}
