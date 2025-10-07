import { type t, Err } from './common.ts';

export function resolve<F extends t.Factory<any, any>>(
  plan: t.Plan<F>,
  factory: F,
): Promise<t.ResolveResult<F>> {
  const cache = new Map<t.ViewIds<F>, t.ModuleOfFactory<F>>();

  const load = async (id: t.ViewIds<F>): Promise<t.ErrCatch<t.ModuleOfFactory<F>>> => {
    // Memoized hit:
    if (cache.has(id)) {
      return { ok: true, data: cache.get(id)!, error: undefined };
    }

    const res = await factory.getView(id as any);
    if (!res.ok) {
      const msg = res.error?.message ?? 'Unknown error';
      // Wrap unknown-id into a stable error surface:
      if (msg.startsWith('Unknown view id')) {
        return {
          ok: false,
          error: Err.std(msg, { name: 'UnknownViewId', cause: res.error }),
        };
      }
      // Wrap loader errors:
      return {
        ok: false,
        error: Err.std(`Failed to load view “${id}”`, { name: 'LoadError', cause: res.error }),
      };
    }

    // success
    cache.set(id, res.module as t.ModuleOfFactory<F>);
    return { ok: true, data: res.module as t.ModuleOfFactory<F>, error: undefined };
  };

  const resolveNode = async (node: t.PlanNode<F>): Promise<t.ErrCatch<t.ResolvedPlanNode<F>>> => {
    const id = node.component as t.ViewIds<F>;

    const mod = await load(id);
    if (!mod.ok) return { ok: false, error: mod.error };

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

    const slots = Object.keys(outSlots).length
      ? (outSlots as unknown as t.ResolvedPlanNode<F>['slots'])
      : undefined;

    const data: t.ResolvedPlanNode<F> = {
      component: id,
      props: node.props,
      module: mod.data,
      slots,
    };

    return { ok: true, data, error: undefined };
  };

  return (async () => {
    const res = await resolveNode(plan.root as t.PlanNode<F>);
    if (!res.ok) return { ok: false, error: res.error };
    return { ok: true, root: res.data, cache } as t.ResolveOk<F>;
  })();
}
