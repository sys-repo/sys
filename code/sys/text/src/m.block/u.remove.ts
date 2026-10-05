import { type t } from './common.ts';
import { TextUpdate } from '../m.update/mod.ts';
import { detect } from './u.detect.ts';
import { invalidPlan, resultToPlan, unchangedPlan } from './u.plan.ts';

/** Remove a marker-bounded block. */
export const remove: t.TextBlock.Remove = (args) => {
  const before = args.text;
  const state = detect(args);
  if (state.kind === 'invalid') return invalidPlan(before, state);
  if (state.kind === 'missing') return unchangedPlan(before, state);

  const result = TextUpdate.apply(before, [TextUpdate.delete(state.range, 'block:remove')]);
  return resultToPlan('remove', state, result);
};
