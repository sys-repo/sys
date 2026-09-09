import { Is, type t } from './common.ts';

export const toComposite: t.CompositeHash.Lib['toComposite'] = (input) => {
  if (!input) return { digest: '', parts: {} };
  return Is.compositeBuilder(input) ? input.toObject() : input;
};
