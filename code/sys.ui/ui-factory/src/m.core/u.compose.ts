import { type t } from './common.ts';
import { make } from './u.make.ts';

export function compose<Id extends t.ViewId>(factories: readonly t.Factory<Id>[]): t.Factory<Id> {
  const merged: Record<Id, t.Registration<Id>> = {} as any;
  for (const f of factories) Object.assign(merged, f.specs);
  return make<Id>(Object.values(merged));
}
