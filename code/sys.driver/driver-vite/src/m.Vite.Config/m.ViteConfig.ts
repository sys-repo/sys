import { workspace } from '../m.Vite.Config.Workspace/mod.ts';

import type { t } from './common.ts';
import { Is } from './m.Is.ts';
import { toAlias as alias } from './u.alias.ts';
import { app } from './u.app.ts';
import { fromFile } from './u.fromFile.ts';
import { paths } from './u.path.ts';

/**
 * Helpers for configuring a Vite server → https://vitejs.dev/config
 */
export const ViteConfig: t.ViteConfigLib = {
  Is,
  app,
  alias,
  paths,
  fromFile,
  workspace,
};
