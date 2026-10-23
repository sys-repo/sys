import { Cmd as CmdKernel, type t } from './common.ts';

/** Files Cmd grammar names and namespace. */
export const Cmd: t.Files.Cmd.Lib = {
  make,
  ns: 'sys.files',
  Name: {
    capabilities: 'files:capabilities',
    list: 'files:list',
    stat: 'files:stat',
    read: 'files:read',
    write: 'files:write',
    remove: 'files:remove',
    watch: 'files:watch',
    manifest: 'files:manifest',
  },
};

/**
 * Helpers:
 */
function make(): t.Files.Cmd.Factory {
  return CmdKernel.make<
    t.Files.Cmd.Name,
    t.Files.Cmd.Payload,
    t.Files.Cmd.Result,
    t.Files.Cmd.Event
  >({ ns: Cmd.ns });
}
