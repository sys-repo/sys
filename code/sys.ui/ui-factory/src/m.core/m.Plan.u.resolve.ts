import { type t } from './common.ts';

type GetViewResultOf<F extends t.Factory<any, any>> = Awaited<ReturnType<F['getView']>>;
type GetViewOkOf<F extends t.Factory<any, any>> = Extract<GetViewResultOf<F>, { ok: true }>;

export function resolve<F extends t.Factory<any, any>>(
  plan: t.Plan<F>,
  factory: F,
): Promise<t.ResolveResult<F>> {
  // component-id → loaded module (adapter-specific)
  const cache = new Map<t.ViewIds<F>, t.ModuleOfFactory<F>>();

  const load = async (id: t.ViewIds<F>): Promise<t.ErrCatch<t.ModuleOfFactory<F>>> => {
    // Memoized hit:
    if (cache.has(id)) return { ok: true, data: cache.get(id)!, error: undefined };

    // Derive result type from this factory's getView
    const res = (await factory.getView(id)) as GetViewResultOf<F>;
    if (!res.ok) return { ok: false, error: res.error };

    // Module is now typed as GetViewOkOf<F>['module'] === ModuleOfFactory<F>
    const mod = (res as GetViewOkOf<F>).module as t.ModuleOfFactory<F>;
    cache.set(id, mod);
    return { ok: true, data: mod, error: undefined };
  };

  const resolveNode = async (node: t.PlanNode<F>): Promise<t.ErrCatch<t.ResolvedPlanNode<F>>> => {
    const id = node.component as t.ViewIds<F>;

    // Load module (memoized):
    const mod = await load(id);
    if (!mod.ok) return { ok: false, error: mod.error };

    // Recurse into slots:
    const entries = Object.entries(node.slots ?? {}) as Array<
      [string, t.PlanNode<F> | ReadonlyArray<t.PlanNode<F>>]
    >;

    type TOut = Record<string, t.ResolvedPlanNode<F> | ReadonlyArray<t.ResolvedPlanNode<F>>>;
    const outSlots: TOut = {};

    for (const [slotName, childOrList] of entries) {
      if (Array.isArray(childOrList)) {
        const resolvedChildren: t.ResolvedPlanNode<F>[] = [];
        for (const c of childOrList) {
          const r = await resolveNode(c as t.PlanNode<F>);
          if (!r.ok) return { ok: false, error: r.error };
          resolvedChildren.push(r.data);
        }
        outSlots[slotName] = resolvedChildren;
      } else {
        const r = await resolveNode(childOrList as t.PlanNode<F>);
        if (!r.ok) return { ok: false, error: r.error };
        outSlots[slotName] = r.data;
      }
    }

    // Cast only at the boundary
    const slots = Object.keys(outSlots).length
      ? (outSlots as unknown as t.ResolvedPlanNode<F>['slots'])
      : undefined;

    const resolved: t.ResolvedPlanNode<F> = {
      component: id,
      props: node.props,
      module: mod.data, // typed as ModuleOfFactory<F>
      slots,
    };

    return { ok: true, data: resolved, error: undefined };
  };

  // Finish up:
  return (async () => {
    const { ok, data, error } = await resolveNode(plan.root as t.PlanNode<F>);
    if (!ok) return { ok: false, error };
    return { ok: true, root: data, cache } as t.ResolveOk<F>;
  })();
}
