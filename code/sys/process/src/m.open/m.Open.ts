import { type t } from './common.ts';
import { invokeDetached } from './u.invokeDetached.ts';
import { resolveCommand } from './u.resolveCommand.ts';

export const Open: t.OpenLib = {
  resolveCommand,
  invokeDetached,
};
