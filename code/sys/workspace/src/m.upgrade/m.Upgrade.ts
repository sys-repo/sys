import type { t } from './common.ts';
import { apply } from './u.apply.ts';
import { collect } from './u.collect.ts';
import { upgrade } from './u.upgrade.ts';

/**
 * Inspect and update dependency pins, keeping registry evidence separate from version choices.
 */
export const WorkspaceUpgrade: t.WorkspaceUpgrade.Lib = Object.freeze({ apply, collect, upgrade });
