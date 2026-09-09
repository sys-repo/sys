import type { t } from './common.ts';

import { Is } from './m.Is.ts';
import { init } from './u.init.ts';
import { load } from './u.load.ts';

/** Environment-file loading and initialization helpers. */
export const Env: t.Env.Lib = Object.freeze({
  Is,
  load,
  init,
});
