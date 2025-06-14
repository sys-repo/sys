import type { t } from './common.ts';
type O = Record<string, unknown>;

/**
 * A repository of CRDT documents:
 */
export type CrdtRepo = {
  readonly id: { readonly instance?: t.StringId; readonly peer: t.StringId };
  create<T extends O>(initial: T | (() => T)): t.CrdtRef<T>;
  get<T extends O>(id: t.StringId): Promise<t.CrdtRef<T> | undefined>;
};
