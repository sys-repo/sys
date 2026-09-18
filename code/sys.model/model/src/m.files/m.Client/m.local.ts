import { Cmd as CmdKernel, type t } from '../common.ts';
import { Cmd as CmdFiles } from '../m.Cmd.ts';
import { createHandle } from './u.handle.ts';

/** Bind an in-process Files backing and return a Files client handle. */
export const local: t.Files.Client.Lib['local'] = (backing, options = {}) => {
  const factory = CmdFiles.make();
  const transport = CmdKernel.Transport.local({ factory, handlers: backing.handlers });
  const cmd = factory.client(transport.endpoint, options);
  return createHandle(cmd, transport);
};
