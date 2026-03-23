import type { t } from './common.ts';
import { collect } from './u.collect.ts';
import { upgrade } from './u.upgrade.ts';

/** Workspace dependency upgrade orchestration library. */
export const WorkspaceUpgrade: t.WorkspaceUpgrade.Lib = { collect, upgrade };
