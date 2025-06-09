import { Repo } from '@automerge/automerge-repo';
import { NodeFSStorageAdapter } from '@automerge/automerge-repo-storage-nodefs';

import { type t } from './common.ts';
import { CrdtIs as Is } from './m.Is.ts';
import { toRepo } from './u.toRepo.ts';

export const Crdt: t.CrdtLibFs = {
  Is,
  kind: 'FileSystem',
  async repo(input) {
    const args = wrangle.dir(input);
    const { sharePolicy, denylist } = args;
    const network = wrangle.network(args);
    const storage = new NodeFSStorageAdapter(args.dir);
    const base = new Repo({ storage, network, sharePolicy, denylist });
    return toRepo(base);
  },
};

/**
 * Helpers:
 */
const wrangle = {
  dir(input: t.StringDir | t.CrdtFsRepoArgs): t.CrdtFsRepoArgs {
    if (typeof input === 'string') return { dir: input };
    return input;
  },
  network(args: t.CrdtFsRepoArgs): t.NetworkAdapterInterface[] | undefined {
    if (!args.network) return;
    return Array.isArray(args.network) ? args.network : [args.network];
  },
} as const;
