import type { AutomergeUrl, NetworkAdapterInterface, SharePolicy } from '@automerge/automerge-repo';
import type { t } from './common.ts';

type StringWebsocketEndpoint = string;

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
  network?: CrdtFsNetworkArgInput | CrdtFsNetworkArgInput[];
  sharePolicy?: SharePolicy;
  denylist?: AutomergeUrl[];
};

/** Network connection argument. */
export type CrdtFsNetworkArgInput = CrdtFsNetworkArg | NetworkAdapterInterface;
export type CrdtFsNetworkArg =
  | StringWebsocketEndpoint // ↓ shorthand for: ↓
  | { ws: StringWebsocketEndpoint };
