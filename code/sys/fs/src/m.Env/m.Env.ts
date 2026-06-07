import { type t } from './common.ts';

import { Is } from './m.Is.ts';
import { init } from './u.init.ts';
import { load } from './u.load.ts';

export const Env: t.Env.Lib = {
  Is,
  load,
  init,
};
