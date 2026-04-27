import type { t } from './common.ts';

/**
 * Walk a plan tree, validate props against provided validators,
 * and invoke callbacks for any errors.
 */
export function validatePlan<F extends t.ReactFactory<any, any>>(
  plan: t.Plan<F>,
  validators: t.PropsValidators<t.ViewIds<F>>,
  opts: t.UseFactoryValidateOptions,
) {
  const all: t.UseFactoryValidateError[] = [];

  const push = (err: t.UseFactoryValidateError) => {
    opts.onError?.(err);
    all.push(err);
  };

  const walk = (node: t.PlanNode<F>): void => {
    // Validate this node's props (if a validator exists for the id):
    const v = validators[node.component as t.ViewIds<F>];
    if (v) {
      const res = v.validate(node.props);
      if (!res.ok) {
        for (const e of res.errors) {
          push({ id: node.component as t.ViewId, path: e.path, message: e.message });
          if (opts.failFast) return;
        }
      }
    }

    // Walk child slots:
    const slots = node.slots as Record<string, unknown> | undefined;
    if (!slots) return;

    for (const value of Object.values(slots)) {
      if (Array.isArray(value)) {
        for (const child of value as readonly t.PlanNode<F>[]) {
          walk(child);
          if (opts.failFast && all.length > 0) return;
        }
      } else if (value && typeof value === 'object' && 'component' in (value as any)) {
        walk(value as t.PlanNode<F>);
        if (opts.failFast && all.length > 0) return;
      }
      // else: Ignore <undefined/null/invalid> shapes gracefully.
    }
  };

  walk(plan.root);
  if (all.length > 0) opts.onErrors?.(all);
}
