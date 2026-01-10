import { type t, Process } from './common.ts';
import { resolveCommand } from './u.resolveCommand.ts';

export const invokeDetached: t.OpenLib['invokeDetached'] = (cwd, url, opts = {}) => {
  const { silent = true } = opts;
  const { cmd, args } = resolveCommand(url);
  void Process.invokeDetached({ cmd, args: [...args], cwd, silent });
};
