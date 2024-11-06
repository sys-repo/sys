import type { t } from './common.ts';
import { commonPlugins as common } from './u.commonPlugins.ts';
import { workspacePlugin as workspace } from './u.workspacePlugin.ts';

export const Plugin: t.VitePluginLib = {
  workspace,
  common,
};
