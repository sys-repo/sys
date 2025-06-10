import { Repo } from '@automerge/automerge-repo';
import { NodeFSStorageAdapter } from '@automerge/automerge-repo-storage-nodefs';
import { CrdtIs, type t, toRepo } from './common.ts';

type A = t.CrdtFsRepoArgs;

export const Crdt: t.CrdtFilesystemLib = {
  kind: 'Crdt:FileSystem',
  Is: CrdtIs,
  repo(input) {
    const args = wrangle.dir(input);
    const { sharePolicy, denylist } = args;
    const network = wrangle.network(args);
    const storage = wrangle.storage(args);
    const base = new Repo({ storage, network, sharePolicy, denylist });
    return toRepo(base);
  },
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
  network(args?: A): t.NetworkAdapterInterface[] | undefined {
    if (!args?.network) return;
    return Array.isArray(args.network) ? args.network : [args.network];
  },
  storage(args?: A): NodeFSStorageAdapter | undefined {
    const dir = args?.dir;
    return dir ? new NodeFSStorageAdapter(dir) : undefined;
  },
} as const;
