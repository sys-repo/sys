import { format } from '@std/fmt/bytes';
import type { t } from './common.ts';

export const bytes: t.FormatBytes = (num, options = {}) => {
  const { compact = false } = options;
  if (typeof num !== 'number') return format(0);
  let str = format(num, options);
  if (compact) str = str.replace(/\s/g, '');
  return str;
};
