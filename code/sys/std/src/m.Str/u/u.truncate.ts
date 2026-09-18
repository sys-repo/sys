import type { t } from '../common.ts';

export const truncate: t.Str.Lib['truncate'] = (text = '', max, options = {}) => {
  const { ellipsis = '…' } = options;
  if (!text || max <= 0) return '';
  if (text.length <= max) return text;

  const available = Math.max(0, max - ellipsis.length);
  return text.slice(0, available) + ellipsis;
};
