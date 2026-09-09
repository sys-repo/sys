import { type t } from '../common.ts';

export const relativePosix: t.Path.Lib['relativePosix'] = (input) => {
  return String(input).replace(/\\/g, '/').replace(/^\/+/, '');
};
