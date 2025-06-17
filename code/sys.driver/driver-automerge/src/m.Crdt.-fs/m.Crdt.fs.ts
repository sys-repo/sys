import { Repo } from '@automerge/automerge-repo';
import { BrowserWebSocketClientAdapter } from '@automerge/automerge-repo-network-websocket';
import { NodeFSStorageAdapter } from '@automerge/automerge-repo-storage-nodefs';

import { type t, CrdtIs, CrdtUrl, Is, slug, toRepo } from './common.ts';

type A = t.CrdtFsRepoArgs;

/**
 * Exports:
 */
export { toAutomergeHandle, toAutomergeRepo } from './common.ts';

/**
 * Library:
 */
export const Crdt: t.CrdtFilesystemLib = {
  kind: 'Crdt:FileSystem',
  repo(input) {
    const args = wrangle.dir(input);
    const { sharePolicy, denylist } = args;
    const network = wrangle.network(args);
    const storage = wrangle.storage(args);
    const peerId = `peer.${slug()}` as t.PeerId;
    const base = new Repo({ storage, network, sharePolicy, denylist, peerId });
    return toRepo(base, { peerId });
  },
  Is: CrdtIs,
  Url: CrdtUrl,
};

/**
 * Helpers:
 */
const wrangle = {
  dir(input?: t.StringDir | A): A {
    if (input == null) return {};
    if (typeof input === 'string') return { dir: input };
    return input;
  },

  storage(args?: A): NodeFSStorageAdapter | undefined {
    const dir = args?.dir;
    return dir ? new NodeFSStorageAdapter(dir) : undefined;
  },

  ws(text: string): BrowserWebSocketClientAdapter {
    const url = Crdt.Url.ws(text);
    return new BrowserWebSocketClientAdapter(url);
  },

  network(input?: A): t.NetworkAdapterInterface[] | undefined {
    if (!input?.network) return;

    type R = t.NetworkAdapterInterface;
    const args = Array.isArray(input.network) ? input.network : [input.network];
    return args.map(toNetworkAdapter).filter(Boolean) as R[];
  },
} as const;

const toNetworkAdapter = (arg: t.CrdtFsNetworkArg): t.NetworkAdapterInterface | undefined => {
  if (arg instanceof BrowserWebSocketClientAdapter) return arg;
  if (Is.string(arg)) return wrangle.ws(arg);
  if (Is.record(arg) && Is.string(arg.ws)) return wrangle.ws(arg.ws);
  return undefined;
};
