import type { t } from './common.ts';
import { workspacePlugin as workspace } from './u.ts';

export const Plugin: t.VitePluginLib = {
  workspace,
};
