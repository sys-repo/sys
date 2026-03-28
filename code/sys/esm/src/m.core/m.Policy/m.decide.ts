import { type t } from './common.ts';
import { candidates } from './m.candidates.ts';
import { wrangle } from './u.wrangle.ts';

export const decideAll: t.EsmPolicy.Lib['decideAll'] = (inputs) => {
  return { decisions: inputs.map((input) => decide(input)) };
};

export const decide: t.EsmPolicy.Lib['decide'] = (input) => {
  const selection = candidates(input);
  const { policy, subject } = input;

  if (wrangle.excluded(policy, subject.entry)) {
    return blocked(input, selection, 'policy:excluded');
  }

  if (selection.available.length === 0) {
    return blocked(input, selection, 'version:none-available');
  }

  if (policy.mode === 'none') {
    return blocked(input, selection, 'policy:none');
  }

  const selected = wrangle.select(policy.mode, selection);
  if (!selected) {
    return blocked(input, selection, wrangle.reason(policy.mode, selection));
  }

  return {
    ok: true,
    input,
    selection: { ...selection, selected },
  };
};

function blocked(
  input: t.EsmPolicy.Input,
  selection: t.EsmPolicy.Selection,
  code: t.EsmPolicy.BlockedCode,
): t.EsmPolicy.Blocked {
  return {
    ok: false,
    input,
    selection,
    reason: { code },
  };
}
