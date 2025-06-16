import type { AutomergeUrl, NetworkAdapterInterface, SharePolicy } from '@automerge/automerge-repo';
import type { t } from './common.ts';

/**
 * API for CRDT's on a file-system:
 */
export type CrdtFilesystemLib = {
  readonly kind: 'Crdt:FileSystem';
  readonly Is: t.CrdtIsLib;
  readonly Url: t.CrdtUrlLib;
  repo(args?: t.StringDir | t.CrdtFsRepoArgs): t.CrdtRepo;
};

/** Arguments for file-system `Crdt.repo` method. */
export type CrdtFsRepoArgs = {
  dir?: t.StringDir;
  network?: CrdtFsNetworkArg | CrdtFsNetworkArg[];
  sharePolicy?: SharePolicy;
  denylist?: AutomergeUrl[];
};

/** Network connection argument. */
export type CrdtFsNetworkArg = NetworkAdapterInterface | { ws: t.StringUrl };
