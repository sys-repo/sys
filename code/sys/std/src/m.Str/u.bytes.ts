import prettyBytes from 'pretty-bytes';
import type { t } from './common.ts';

export const bytes: t.FormatBytes = (num, options = {}) => {
  return prettyBytes(num ?? 0, options);
};
