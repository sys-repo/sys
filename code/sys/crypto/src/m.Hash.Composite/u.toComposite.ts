import { type t, Is } from './common.ts';

export const toComposite: t.CompositeHashLib['toComposite'] = (input) => {
  if (!input) return { digest: '', parts: {} };
  return Is.compositeBuilder(input) ? input.toObject() : input;
};
