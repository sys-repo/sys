import { type t } from './common.ts';
import { TextUpdate } from '../m.update/mod.ts';
import { detect } from './u.detect.ts';
import { invalidPlan, resultToPlan, unchangedPlan } from './u.plan.ts';
import { render } from './u.render.ts';

/** Add or replace a marker-bounded block. */
export const update: t.TextBlock.Update = (args) => {
  const before = args.text;
  const state = detect(args);
  if (state.kind === 'invalid') return invalidPlan(before, state);

  if (state.kind === 'missing') {
    const newline = args.newline ?? TextUpdate.newlineOf(before);
    const block = render({ ...args, newline });
    const insertion = before.length === 0 || before.endsWith('\n') ? block : `${newline}${block}`;
    const result = TextUpdate.apply(before, [
      TextUpdate.insert(before.length, insertion, 'block:add'),
    ]);
    return resultToPlan('add', state, result);
  }

  const newline = args.newline ?? state.newline;
  const block = render({ ...args, newline });
  if (block === state.block) return unchangedPlan(before, state);

  const result = TextUpdate.apply(before, [
    TextUpdate.replace(state.range, block, 'block:replace'),
  ]);
  return resultToPlan('replace', state, result);
};
