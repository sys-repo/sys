import { type t } from './common.ts';
import { validationError, validationOk } from './u.Plan.ts';

/**
 * Validate canonical, factory-typed plan without mutation.
 * Walks the slot map, short-circuiting on first error.
 */
export function validate<F extends t.Factory<any, any>>(
  plan: t.Plan<F>,
  factory: F,
): t.PlanValidateResult {
  // Read registrations, not specs.
  const regs = factory.specs as t.SpecsMap<t.ViewIds<F>>;

  const walk = (node: t.PlanNode<F>, path: number[]): t.PlanValidateResult => {
    const id = node.component as t.ViewIds<F>;

    // Pull the spec for this node's component:
    const spec = (regs as any)[id]?.spec as Readonly<{ slots?: readonly string[] }> | undefined;
    if (!spec) return validationError('UNKNOWN_VIEW_ID', `Unknown view id: '${String(id)}'`, path);

    type Entries = Array<[string, t.PlanNode<F> | ReadonlyArray<t.PlanNode<F>>]>;
    const entries = Object.entries(node.slots ?? {}) as Entries;
    const allowed = (spec.slots ?? []) as readonly string[]; // ← Declared slots for this component.

    let childIdx = 0;
    for (const [slotName, childOrList] of entries) {
      if (!allowed.includes(slotName)) {
        const msg = `Invalid slot '${slotName}' for '${String(id)}'`;
        return validationError('INVALID_SLOT', msg, path, allowed, slotName);
      }

      const list = Array.isArray(childOrList) ? childOrList : [childOrList];
      for (const child of list) {
        const res = walk(child as t.PlanNode<F>, path.concat(childIdx));
        if (!res.ok) return res;
        childIdx += 1;
      }
    }

    return validationOk();
  };

  return walk(plan.root as t.PlanNode<F>, []);
}
