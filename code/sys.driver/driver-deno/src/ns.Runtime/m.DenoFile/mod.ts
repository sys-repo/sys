/**
 * @module
 * Tools for working with a `deno.json` file.
 */
import type { t } from './common.ts';
import { load } from './u.load.ts';
import { isWorkspace, workspace } from './u.workspace.ts';

export const DenoFile: t.DenoFileLib = {
  load,
  workspace,
  isWorkspace,
};
