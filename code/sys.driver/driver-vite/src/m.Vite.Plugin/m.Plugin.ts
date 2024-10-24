import type { t } from './common.ts';
import { workspacePlugin as workspace } from './u.workspacePlugin.ts';
import { commonPlugin as common } from './u.commonPlugin.ts';

export const Plugin: t.VitePluginLib = {
  common,
  workspace,
};
