import type { t } from './common.ts';
type O = Record<string, unknown>;

/**
 * A repository of CRDT documents:
 */
export type CrdtRepo = {
  readonly id: { peer: string };
  create<T extends O>(initial: T): t.CrdtRef<T>;
  get<T extends O>(id: t.StringId): Promise<t.CrdtRef<T> | undefined>;
};
