import { type t } from './common.ts';
import { resolve } from './m.Plan.u.resolve.ts';
import { validate } from './m.Plan.u.validate.ts';
import { validationError, validationOk } from './u.Plan.ts';

export const Plan: t.PlanLib = {
  validate,
  resolve,

  /**
   * Validate a linear plan (Id/Slot/Children) without mutation.
   * This is ideal for tests and simple authoring.
   */
  validateLinear<Id extends string, Slot extends string>(
    plan: t.LinearPlan<Id, Slot>,
    factory: t.FactoryWithSlots<Id, Slot>,
  ): t.PlanValidateResult {
    // Keep registrations, not specs:
    const regs = factory.specs as Readonly<Record<Id, t.Registration<Id, Slot>>>;

    const walk = (
      node: t.LinearPlanNode<Id, Slot>,
      parentId: Id | null,
      path: number[],
    ): t.PlanValidateResult => {
      const spec = regs[node.id as Id]?.spec;
      if (!spec)
        return validationError('UNKNOWN_VIEW_ID', `Unknown view id: '${node.id as string}'`, path);

      if (parentId) {
        const parentSpec = regs[parentId]?.spec;
        const allowed = (parentSpec?.slots ?? []) as readonly Slot[];
        if (node.slot !== undefined) {
          const got = node.slot as Slot;
          if (!allowed.includes(got)) {
            const msg = `Invalid slot '${got as string}' for parent '${parentId as string}'`;
            return validationError(
              'INVALID_SLOT',
              msg,
              path,
              allowed as readonly string[],
              got as string,
            );
          }
        }
      }

      const children = node.children ?? [];
      for (let i = 0; i < children.length; i += 1) {
        const res = walk(children[i], node.id as Id, path.concat(i));
        if (!res.ok) return res;
      }
      return validationOk();
    };

    return walk(plan.root, null, []);
  },

  fromLinear<Id extends string, Slot extends string, F extends t.FactoryWithSlots<Id, Slot>>(
    linear: t.LinearPlan<Id, Slot>,
    factory: F,
    opts?: { placeUnslotted?: 'first-slot' | 'reject' },
  ): t.Plan<F> {
    const strategy = opts?.placeUnslotted ?? 'first-slot';
    const regs = factory.specs as Readonly<Record<Id, t.Registration<Id, Slot>>>;
    type SlotsType<TF extends t.Factory<any, any>> = t.PlanNode<TF>['slots'];

    const convertNode = (node: t.LinearPlanNode<Id, Slot>): t.PlanNode<F> => {
      const id = node.id as t.ViewIds<F>;
      const parentReg = regs[id as Id];
      const parentSpec = parentReg?.spec;
      if (!parentSpec) throw new Error(`Unknown view id: '${String(id)}'`);

      const declared = (parentSpec.slots ?? []) as readonly Slot[];

      // Group children by slot:
      const children = node.children ?? [];
      const grouped: Record<string, t.PlanNode<F>[]> = {};

      for (const child of children) {
        const childId = child.id as Id;
        if (!regs[childId]?.spec) throw new Error(`Unknown view id: '${String(childId)}'`);

        let slotName = child.slot as Slot | undefined;

        if (slotName === undefined) {
          if (declared.length === 0) {
            // NB: The parent declares no slots → child cannot be placed in canonical slots map.
            //     Current strategy: drop the child from grouping (it has no legal container).
            //     NOTE: this could later be made stricter (e.g. reject outright).
          } else if (strategy === 'reject') {
            throw new Error(`Child of '${String(id)}' is missing a slot and strategy is 'reject'`);
          } else {
            // Default strategy: assign to the parent's first declared slot.
            slotName = declared[0];
          }
        } else {
          // Slot was provided → ensure parent declares it
          if (!declared.includes(slotName)) {
            throw new Error(`Invalid slot '${String(slotName)}' for parent '${String(id)}'`);
          }
        }

        // Only place into grouped if we have an actual declared slot target
        if (slotName !== undefined && declared.includes(slotName)) {
          (grouped[slotName as unknown as string] ??= []).push(convertNode(child));
        }
        // else: Unslotted child under a parent with no declared slots → omit from slots map
        // (Effectively the child is unreachable via slots in canonical form.)
      }

      const hasSlots = Object.keys(grouped).length > 0;
      const slots: SlotsType<F> | undefined = hasSlots
        ? (grouped as unknown as SlotsType<F>)
        : undefined;

      return {
        component: id,
        props: node.props,
        slots,
      } as t.PlanNode<F>;
    };

    return { root: convertNode(linear.root) } as t.Plan<F>;
  },
};
