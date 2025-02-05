/**
 * @module
 * Tools for working with a `deno.json` file.
 */
import { type t } from './common.ts';
import { isWorkspace, load } from './u.ts';
import { workspace } from './u.workspace.ts';

export const DenoFile: t.DenoFileLib = {
  load,
  workspace,
  isWorkspace,
};
