import { type t } from './common.ts';
import { invokeDetached } from './u.invokeDetached.ts';
import { resolveCommand } from './u.resolveCommand.ts';

/**
 * Open helpers for launching URLs and paths via the OS
 * default handler in a detached child process.
 */
export const Open: t.OpenLib = {
  resolveCommand,
  invokeDetached,
};
