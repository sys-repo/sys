import { type t } from './common.ts';

export const relativePosix: t.PathLib['relativePosix'] = (input) => {
  return String(input).replace(/\\/g, '/').replace(/^\/+/, '');
};
