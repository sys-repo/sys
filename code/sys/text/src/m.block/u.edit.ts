import { Is, type t } from './common.ts';
import { TextUpdate } from '../m.update/mod.ts';
import { detect } from './u.detect.ts';
import { invalidPlan, unchangedPlan } from './u.plan.ts';
import { update } from './u.update.ts';

/** Edit inner block content while preserving marker safety. */
export const edit: t.TextBlock.Edit = (args) => {
  const before = args.text;
  const state = detect(args);
  if (state.kind === 'invalid') return invalidPlan(before, state);

  if (state.kind === 'missing' && args.onMissing !== 'add') return unchangedPlan(before, state);

  const content = state.kind === 'present' ? state.content : '';
  const newline = state.kind === 'present' ? state.newline : TextUpdate.newlineOf(before);
  const result = args.edit({ state, content, newline });

  if (result === undefined) {
    if (state.kind === 'present') return unchangedPlan(before, state);
    return update({ text: before, markers: args.markers, content: '', newline });
  }

  if (Is.string(result)) {
    if (state.kind === 'present' && result === state.content) return unchangedPlan(before, state);
    return update({ text: before, markers: args.markers, content: result, newline });
  }

  if (!result.ok) return invalidPlan(before, state, result.error);
  if (state.kind === 'present' && result.after === state.content) {
    return unchangedPlan(before, state);
  }

  return update({ text: before, markers: args.markers, content: result.after, newline });
};
