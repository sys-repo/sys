import { format } from '@std/fmt/bytes';
import type { t } from './common.ts';

export const bytes: t.FormatBytes = (num, options = {}) => {
  const { compact = false } = options;
  let str = format(num ?? 0, options);
  if (compact) str = str.replace(/\s/g, '');
  return str;
};
