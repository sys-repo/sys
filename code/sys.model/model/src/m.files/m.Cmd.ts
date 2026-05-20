import type { t } from './common.ts';

/** Files Cmd grammar names and namespace. */
export const Cmd: t.FilesCmd.Lib = {
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
