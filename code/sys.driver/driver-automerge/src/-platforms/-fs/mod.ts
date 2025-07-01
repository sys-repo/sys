/**
 * CRDTs that work on a local/native file-system.
 * @module
 */
import { BrowserWebSocketClientAdapter } from '@automerge/automerge-repo-network-websocket';
import { NodeFSStorageAdapter } from '@automerge/automerge-repo-storage-nodefs';
import { type t, Arr, AutomergeRepo, CrdtIs, CrdtUrl, createPeerId, Is, toRepo } from './common.ts';

type Args = t.CrdtFsRepoArgs;

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
    const peerId = createPeerId();
    const base = new AutomergeRepo({ storage, network, sharePolicy, denylist, peerId });
    return toRepo(base, { peerId });
  },
  Is: CrdtIs,
  Url: CrdtUrl,
};

/**
 * Helpers:
 */
const wrangle = {
  dir(input?: t.StringDir | Args): Args {
    if (input == null) return {};
    if (typeof input === 'string') return { dir: input };
    return input;
  },

  storage(args?: Args): NodeFSStorageAdapter | undefined {
    const dir = args?.dir;
    return dir ? new NodeFSStorageAdapter(dir) : undefined;
  },

  network(input?: Args): t.NetworkAdapterInterface[] {
    if (!input?.network) return [];
    return Arr.asArray(input.network)
      .map(wrangle.adapter)
      .filter(Boolean) as t.NetworkAdapterInterface[];
  },

  adapter(arg?: t.CrdtFsNetworkArgInput) {
    if (Is.string(arg)) return wrangle.ws(arg);
    if (Is.record(arg) && Is.string(arg.ws)) return wrangle.ws(arg.ws);
    return arg as t.NetworkAdapterInterface | undefined;
  },

  ws(text: string): BrowserWebSocketClientAdapter {
    const url = Crdt.Url.ws(text);
    return new BrowserWebSocketClientAdapter(url);
  },
} as const;
