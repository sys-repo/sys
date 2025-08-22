import { Err, type t } from './common.ts';

/**
 * Factory: Make
 */
export function make<Id extends t.ViewId, Reg extends t.Registration<Id, t.SlotId, any>>(
  regs: readonly Reg[],
): t.Factory<Id, Reg> {
  // Mirror Factory<Id, Reg>['specs'] type so merged specs keep the exact Id → Reg mapping:
  type F = t.Factory<Id, Reg>['specs'];
  const specs = Object.fromEntries(regs.map((r) => [r.spec.id as Id, r])) as F;

  const getView: t.Factory<Id, Reg>['getView'] = async (id) => {
    const reg = specs[id];
    if (!reg) return { ok: false, error: Err.std(`Unknown view id: '${id}'`) };

    try {
      const module = await reg.load();
      return { ok: true, module };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { ok: false, error: Err.std(msg) };
    }
  };

  return { specs, getView };
}

/**
 * Variadic compose implementation (runtime identical)
 */
function compose(factories: readonly t.Factory<any, any>[]) {
  const merged: Record<string, t.Registration<any, any, any>> = {};
  for (const f of factories) Object.assign(merged, f.specs);
  return Factory.make<any, t.Registration<any, any, any>>(Object.values(merged));
}

/**
 * Factory:
 */
export const Factory: t.FactoryLib = {
  make,
  compose: compose as t.FactoryLib['compose'],
};
