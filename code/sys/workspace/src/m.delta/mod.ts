/**
 * @module
 * Workspace package-level change delta helpers.
 */
import type { t } from './common.ts';
import { Git } from './m.Git.ts';
import { fromChangedFiles } from './m.fromChangedFiles.ts';

/**
 * Workspace package-level change delta helper library.
 */
export const WorkspaceDelta: t.WorkspaceDelta.Lib = { fromChangedFiles, Git };
