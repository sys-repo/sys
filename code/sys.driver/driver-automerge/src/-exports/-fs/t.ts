import type { AutomergeUrl, NetworkAdapterInterface, SharePolicy } from '@automerge/automerge-repo';
import type { t } from './common.ts';

/**
 * Filesystem-backed CRDT contracts.
 */
export declare namespace CrdtFs {
  /** API for CRDTs on a filesystem. */
  export type Lib = t.Crdt.Lib & {
    readonly kind: 'crdt:fs';
    repo(args?: t.StringDir | RepoArgs): t.Crdt.Repo;
  };

  /** Arguments for filesystem `Crdt.repo`. */
  export type RepoArgs = {
    dir?: t.StringDir;
    network?: Network.Input | Network.Input[];
    sharePolicy?: SharePolicy;
    denylist?: AutomergeUrl[];
    until?: t.UntilInput;
  };

  /**
   * Filesystem CRDT network contracts.
   */
  export namespace Network {
    /** Network connection argument. */
    export type Arg = t.Crdt.Network.WebsocketEndpoint | t.Crdt.Network.WebsocketArg;

    /** Loose network input accepted by filesystem repos. */
    export type Input = Arg | NetworkAdapterInterface | t.Falsy;
  }
}
