import { type t, Err } from './common.ts';

export function make<Id extends t.ViewId>(regs: readonly t.Registration<Id>[]): t.Factory<Id> {
  const specs = Object.fromEntries(regs.map((r) => [r.spec.id as Id, r])) as t.Factory<Id>['specs'];

  const getView: t.Factory<Id>['getView'] = async (id) => {
    const reg = specs[id];
    if (!reg) return { ok: false, error: Err.std(`Unknown view id: '${id}'`) };
    try {
      const module = await reg.load();
      return { ok: true, module };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? Err.std(err.message) : Err.std(err) };
    }
  };

  return { specs, getView };
}
