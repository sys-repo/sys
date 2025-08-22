import { Err, type t } from './common.ts';

export function make<Id extends t.ViewId, Reg extends t.Registration<Id, t.SlotId, any>>(
  regs: readonly Reg[],
): t.Factory<Id, Reg> {
  // specs: Factory<Id, Reg>['specs'] so we keep the exact mapped/Reg shape
  const specs = Object.fromEntries(regs.map((r) => [r.spec.id as Id, r])) as t.Factory<
    Id,
    Reg
  >['specs'];

  const getView: t.Factory<Id, Reg>['getView'] = async (id) => {
    const reg = specs[id];
    if (!reg) return { ok: false, error: Err.std(`Unknown view id: '${id}'`) };

    try {
      const module = await reg.load();
      // The return type is enforced by the annotation above
      return { ok: true, module };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { ok: false, error: Err.std(msg) };
    }
  };

  return { specs, getView };
}

export function compose<Id extends t.ViewId, Reg extends t.Registration<Id, t.SlotId, any>>(
  factories: readonly t.Factory<Id, Reg>[],
): t.Factory<Id, Reg> {
  // Preserve Reg entries (including module type), last-wins on collisions
  const merged = {} as t.Factory<Id, Reg>['specs'];
  for (const f of factories) {
    for (const [id, entry] of Object.entries(f.specs) as [Id, Reg][]) {
      (merged as any)[id] = entry;
    }
  }
  return make<Id, Reg>(Object.values(merged) as readonly Reg[]);
}

export const Factory: t.FactoryLib = { make, compose };
