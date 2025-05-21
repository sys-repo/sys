import type { t } from '../../-test.ts';
import { Store } from '../Store/mod.ts';

export type DChild = { msg?: string };
export type D = {
  count: number;
  msg?: string;
  list?: number[];
  child?: DChild;
};

export function testSetup() {
  const store = Store.init();
  const initial: t.ImmutableMutator<D> = (d) => (d.count = 0);
  const factory = store.doc.factory<D>(initial);
  return { store, initial, factory } as const;
}
