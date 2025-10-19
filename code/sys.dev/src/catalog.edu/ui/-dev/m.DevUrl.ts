import type { t } from './common.ts';
import { changeDevUrl as change, makeDevUrl as make, readDevUrl as read } from './u.dev.url.ts';


export const DevUrl: t.DevUrlLib = {
  make,
  read,
  change,
};
