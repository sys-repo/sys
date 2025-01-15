import type { t } from './common.ts';
import { main } from './m.main.ts';
import { init } from './m.init.ts';

export const Cmd: t.VitePressCmdLib = {
  init,
  main,
};
