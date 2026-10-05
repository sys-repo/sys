import { type t } from './common.ts';

/** Return an unchanged block plan. */
export function unchangedPlan(before: string, state: t.TextBlock.State): t.TextBlock.Plan {
  return { kind: 'unchanged', state, changed: false, before, after: before, changes: [] };
}

/** Return a fail-safe invalid block plan. */
export function invalidPlan(
  before: string,
  state: t.TextBlock.State,
  error?: t.TextUpdate.UpdateError,
): t.TextBlock.Plan {
  return { kind: 'invalid', state, changed: false, before, after: before, changes: [], error };
}

/** Convert a TextUpdate result into a block plan. */
export function resultToPlan(
  kind: Exclude<t.TextBlock.PlanKind, 'invalid' | 'unchanged'>,
  state: t.TextBlock.State,
  result: t.TextUpdate.Result,
): t.TextBlock.Plan {
  if (!result.ok) return invalidPlan(result.before, state, result.error);
  return {
    kind: result.changed ? kind : 'unchanged',
    state,
    changed: result.changed,
    before: result.before,
    after: result.after,
    changes: result.changes,
  };
}
