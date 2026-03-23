import type { t } from './common.ts';
import { collect } from './u.collect.ts';

/** Workspace dependency upgrade orchestration library. */
export const WorkspaceUpgrade: t.WorkspaceUpgrade.Lib = { collect };
