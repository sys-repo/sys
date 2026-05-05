import { c } from './common.ts';

export const Fmt = {
  Cell: () => c.magenta('Cell'),
  env: () => c.gray('.env'),
} as const;
