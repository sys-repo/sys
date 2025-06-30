import type { t } from './common.ts';

type O = Record<string, unknown>;

/**
 * Core CRDT types:
 */
export namespace Crdt {
  export type Repo = t.CrdtRepo;
  export type Ref<T extends O = O> = t.CrdtRef<T>;
  export type Events<T extends O = O> = t.CrdtEvents<T>;
}
