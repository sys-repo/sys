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
    const { sharePolicy = async () => true, denylist } = args;
    const storage = wrangle.storage(args);
    const network = wrangle.network(args);
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

  network(input?: A): t.NetworkAdapterInterface[] {
    if (!input?.network) return [];
    const args = Array.isArray(input.network) ? input.network : [input.network];
    return args.map(wrangle.adapter).filter(Boolean) as t.NetworkAdapterInterface[];
  },

  adapter(arg?: t.CrdtFsNetworkArg) {
    if (Is.string(arg)) return wrangle.ws(arg);
    if (Is.record(arg) && Is.string(arg.ws)) return wrangle.ws(arg.ws);
    return arg as t.NetworkAdapterInterface | undefined;
  },

  ws(text: string): BrowserWebSocketClientAdapter {
    const url = Crdt.Url.ws(text);
    return new BrowserWebSocketClientAdapter(url);
  },
} as const;
