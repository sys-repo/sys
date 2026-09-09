import type { t } from '../common.ts';
import { Cmd } from '../m.Cmd.ts';
import { createHandle } from './u.handle.ts';

/** Bind a generic Cmd endpoint and return a Files client handle. */
export const transport: t.Files.Client.Lib['transport'] = (endpoint, options = {}) => {
  const cmd = Cmd.make().client(endpoint, options);
  return createHandle(cmd);
};
