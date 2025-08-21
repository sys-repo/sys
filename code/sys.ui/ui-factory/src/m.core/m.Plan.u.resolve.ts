import { type t } from './common.ts';

export function resolve<F extends t.Factory<any, any>>(
  plan: t.Plan<F>,
  factory: F,
): Promise<t.ResolveResult<F>> {
  // Local cache: component-id → loaded module.
  const cache = new Map<t.ViewIds<F>, t.LazyViewModule>();

  const load = async (id: t.ViewIds<F>): Promise<t.ErrCatch<t.LazyViewModule>> => {
    // Memoized hit:
    if (cache.has(id)) {
      return { ok: true, data: cache.get(id)!, error: undefined };
    }
    const res = await factory.getView(id as any);
    if (!res.ok) return { ok: false, error: res.error };
    cache.set(id, res.module);
    return { ok: true, data: res.module, error: undefined };
  };

  const resolveNode = async (node: t.PlanNode<F>): Promise<t.ErrCatch<t.ResolvedPlanNode<F>>> => {
    const id = node.component as t.ViewIds<F>;

    // Load module (memoized):
    const mod = await load(id);
    if (!mod.ok) return { ok: false, error: mod.error };

    // Recurse into slots (preserve canonical structure):
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

    // Cast only at the boundary to the precise slots type expected by `ResolvedPlanNode<F>`:
    const slots = Object.keys(outSlots).length
      ? (outSlots as unknown as t.ResolvedPlanNode<F>['slots'])
      : undefined;

    const resolved: t.ResolvedPlanNode<F> = {
      component: id,
      props: node.props,
      module: mod.data,
      slots,
    };

    return { ok: true, data: resolved, error: undefined };
  };

  // Finish up.
  return (async () => {
    const res = await resolveNode(plan.root as t.PlanNode<F>);
    if (!res.ok) return { ok: false, error: res.error };
    return { ok: true, root: res.data, cache } as t.ResolveOk<F>;
  })();
}
