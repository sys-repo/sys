import { type t } from './common.ts';
import { fromChangedFiles } from './m.fromChangedFiles.ts';
import { changedFilesFromNameStatus } from './u/u.git.ts';

/**
 * Git-backed workspace delta adapters.
 */
export const Git: t.WorkspaceDelta.Git.Lib = {
  fromNameStatus(args) {
    return fromChangedFiles({
      collect: args.collect,
      changedFiles: changedFilesFromNameStatus(args.nameStatus),
    });
  },
};
