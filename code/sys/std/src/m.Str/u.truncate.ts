import { type t } from './common.ts';

export const truncate: t.StrLib['truncate'] = (text = '', max) => {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
};
