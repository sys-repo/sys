import { Err, type t } from './common.ts';

type AnyFactory = t.Factory<any, any>;
type AnyRegistration = t.Registration<any, any, any>;

/**
 * Factory: Make
 */
export function make<Id extends t.ViewId, Reg extends t.Registration<Id, t.SlotId, any>>(
  regs: readonly Reg[],
): t.Factory<Id, Reg> {
  type FSpecs = t.Factory<Id, Reg>['specs'];
  const specs = Object.fromEntries(regs.map((r) => [r.spec.id as Id, r])) as FSpecs;

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

  return {
    specs,
    getView,
    getRegistrations: () => regs,
  };
}

/**
 * Variadic compose (matches FactoryLib['compose'] exactly via overloads).
 */
function compose<const Fs extends readonly AnyFactory[]>(
  factories: [...Fs],
): t.Factory<t.ViewIds<Fs[number]>, Fs[number] extends t.Factory<any, infer Reg> ? Reg : never>;
function compose<Id extends t.ViewId>(factories: readonly t.Factory<Id>[]): t.Factory<Id>;
function compose(factories: readonly AnyFactory[]): t.Factory<any, AnyRegistration> {
  // Merge registrations:
  const merged: Record<string, AnyRegistration> = {};
  for (const f of factories) Object.assign(merged, f.specs);

  // Build a new factory from merged registrations:
  return Factory.make<any, AnyRegistration>(Object.values(merged));
}

/**
 * Factory:
 */
export const Factory: t.FactoryLib = {
  make,
  compose,
};
