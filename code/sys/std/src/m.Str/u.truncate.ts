import { type t } from './common.ts';

export const truncate: t.StrLib['truncate'] = (text = '', max, opts = {}) => {
  const { ellipsis = '…' } = opts;
  if (!text) return '';
  if (max <= 0) return '';
  if (text.length <= max) return text;

  const available = Math.max(0, max - ellipsis.length);
  return text.slice(0, available) + ellipsis;
};
