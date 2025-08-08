import type { EnvLib } from './t.ts';

import { Is } from './m.Is.ts';
import { init } from './u.init.ts';
import { load } from './u.load.ts';

export const Env: EnvLib = {
  Is,
  load,
  init,
};
