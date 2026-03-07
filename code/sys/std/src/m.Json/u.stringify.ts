import { type t } from './common.ts';
import { circularReplacer } from './u.circularReplacer.ts';

export const stringify: t.JsonLib['stringify'] = (input, space = 2, circularTag) => {
  if (input === undefined) throw new Error(`[undefined] is not valid JSON input`);
  const replacer = circularReplacer(circularTag);
  const text = JSON.stringify(input, replacer, space);
  return text.includes('\n') ? `${text}\n` : text; // NB: trailing "new-line" only added if the JSON spans more than a single line
};
