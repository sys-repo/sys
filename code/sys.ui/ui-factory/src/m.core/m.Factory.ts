import { Err, type t } from './common.ts';

export const Factory: t.FactoryLib = {
  make<Id extends t.ViewId>(regs: readonly t.Registration<Id>[]): t.Factory<Id> {
    // Build with the precise mapped key type, then assign per registration id.
    const map = Object.create(null) as { [K in Id]: Readonly<t.Registration<K>> };

    for (const r of regs) {
      const id = r.spec.id as Id;
      // Assign preserving the full registration; no spec rebuild (keeps spec.slots intact).
      (map as any)[id] = r as Readonly<t.Registration<typeof id>>;
    }

    const specs = map as t.SpecsMap<Id>;

    const getView = async (id: Id): Promise<t.GetViewResult> => {
      const reg = (specs as any)[id] as Readonly<t.Registration<Id>> | undefined;
      if (!reg) {
        return {
          ok: false,
          error: Err.std(`Unknown view id: '${id}'`, { name: 'UnknownViewId' }),
        };
      }
      try {
        const module = await reg.load();
        return { ok: true, module };
      } catch (cause) {
        return {
          ok: false,
          error: Err.std(`Failed to load view '${id}'`, { name: 'LoadError', cause }),
        };
      }
    };

    return { specs, getView };
  },

  compose<Id extends t.ViewId>(factories: readonly t.Factory<Id>[]): t.Factory<Id> {
    // Later factories overwrite earlier ones (left → right precedence).
    const map = Object.create(null) as { [K in Id]: Readonly<t.Registration<K>> };

    for (const f of factories) {
      // Copy registrations as-is to preserve spec.slots and any other fields.
      for (const k in f.specs) {
        const id = k as Id;
        (map as any)[id] = (f.specs as any)[id] as Readonly<t.Registration<typeof id>>;
      }
    }

    const specs = map as t.SpecsMap<Id>;

    const getView = async (id: Id): Promise<t.GetViewResult> => {
      const reg = (specs as any)[id] as Readonly<t.Registration<Id>> | undefined;
      if (!reg) {
        return {
          ok: false,
          error: Err.std(`Unknown view id: '${id}'`, { name: 'UnknownViewId' }),
        };
      }
      try {
        const module = await reg.load();
        return { ok: true, module };
      } catch {
        // You used a version without cause in your last snippet for compose; keeping that.
        return {
          ok: false,
          error: Err.std(`Failed to load view '${id}'`, { name: 'LoadError' }),
        };
      }
    };

    return { specs, getView };
  },
};
