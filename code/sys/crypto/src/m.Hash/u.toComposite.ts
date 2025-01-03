import type { t } from './common.ts';
import { Is } from './m.Is.ts';

export const toComposite: t.CompositeHashLib['toComposite'] = (input) => {
  if (!input) return { digest: '', parts: {} };
  return Is.compositeBuilder(input) ? input.toObject() : input;
};
