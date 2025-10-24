import type { Mark as AMMark, MarkRange as AMMarkRange } from '@automerge/automerge';
import type { t } from './common.ts';

type O = Record<string, unknown>;

/**
 * Core CRDT types:
 */
export namespace Crdt {
  export type Repo = t.CrdtRepo;
  export type Ref<T extends O = O> = t.CrdtRef<T>;
  export type Events<T extends O = O> = t.CrdtEvents<T>;
  export type Patch = t.CrdtPatch;
  export namespace Marks {
    export type Mark = AMMark;
    export type Range = AMMarkRange;
  }
}
