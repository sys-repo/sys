/**
 * @module
 * CRDTs that work on a local/native file-system.
 */
import { BrowserWebSocketClientAdapter } from '@automerge/automerge-repo-network-websocket';
import { NodeFSStorageAdapter } from '@automerge/automerge-repo-storage-nodefs';
import {
  type t,
  Arr,
  AutomergeRepo,
  CrdtCmd,
  CrdtGraph,
  CrdtId,
  CrdtIs,
  CrdtUrl,
  CrdtWorker,
  createPeerId,
  Is,
  toObject,
  toRepo,
  whenReady,
  CrdtStr,
} from './common.ts';

type Args = t.CrdtFsRepoArgs;

/**
 * Exports:
 */
export { A, toAutomergeHandle, toAutomergeRepo } from './common.ts';

/**
 * Library:
 */
export const Crdt: t.CrdtFilesystemLib = {
  kind: 'crdt:fs',
  repo(input) {
    const args = wrangle.dir(input);
    const dir = args.dir ?? '';
    const { sharePolicy = async () => true, denylist, until } = args;
    const storage = wrangle.storage(args);
    const network = wrangle.network(args);
    const peerId = createPeerId();
    const base = new AutomergeRepo({ storage, network, sharePolicy, denylist, peerId });
    return toRepo(base, {
      peerId,
      until,
      stores: [{ kind: 'fs', dir }],
    });
  },
  Id: CrdtId,
  Is: CrdtIs,
  Url: CrdtUrl,
  Str: CrdtStr,
  Cmd: CrdtCmd,
  Worker: CrdtWorker,
  Graph: CrdtGraph,
  whenReady,
  toObject,
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
    const dir = wrangle.dir(args).dir;
    return dir ? new NodeFSStorageAdapter(dir) : undefined;
  },

  network(input?: Args): t.NetworkAdapterInterface[] {
    if (!input?.network) return [];
    return Arr.asArray(input.network)
      .filter(Boolean)
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
