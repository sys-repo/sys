import { type t } from '../common.ts';
import { fromChangedFiles } from '../m.fromChangedFiles.ts';
import { changedFilesFromNameStatus } from '../u/u.git.ts';

/**
 * Derive package bump roots and closure from git name-status records.
 */
export function fromNameStatus(args: t.WorkspaceDelta.Git.FromNameStatusArgs) {
  return fromChangedFiles({
    collect: args.collect,
    changedFiles: changedFilesFromNameStatus(args.nameStatus),
  });
}
