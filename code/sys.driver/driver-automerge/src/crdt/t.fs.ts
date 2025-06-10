import type { AutomergeUrl, NetworkAdapterInterface, SharePolicy } from '@automerge/automerge-repo';
import type { t } from './common.ts';

/**
 * API for CRDT's on a file-system:
 */
export type CrdtFilesystemLib = {
  readonly kind: 'Crdt:FileSystem';
  readonly Is: t.CrdtIsLib;
  repo(args?: t.StringDir | t.CrdtFsRepoArgs): Promise<t.CrdtRepo>;
};

/** Arguments for file-system `Crdt.repo` method. */
export type CrdtFsRepoArgs = {
  dir?: t.StringDir;
  network?: NetworkArg | NetworkArg[];
  sharePolicy?: SharePolicy;
  denylist?: AutomergeUrl[];
};

type NetworkArg = NetworkAdapterInterface;
