import type {
  AutomergeUrl,
  NetworkAdapterInterface,
  SharePolicy,
  StorageAdapterInterface,
} from '@automerge/automerge-repo';
import type { t } from './common.ts';

type StringDatabaseName = string;

/**
 * Browser-backed CRDT contracts.
 */
export declare namespace CrdtWeb {
  /** API for CRDTs on IndexedDB in a browser. */
  export type Lib = t.Crdt.Lib & {
    readonly kind: 'crdt:web';
    repo(args?: RepoArgs): t.Crdt.Repo;
  };

  /** Arguments for browser `Crdt.repo`. */
  export type RepoArgs = {
    storage?: Storage.Input;
    network?: Network.Input | Network.Input[];
    sharePolicy?: SharePolicy;
    denylist?: AutomergeUrl[];
    until?: t.UntilInput;
  };

  /**
   * Browser CRDT storage contracts.
   */
  export namespace Storage {
    /** Storage argument. */
    export type Arg = 'IndexedDb' | { database?: StringDatabaseName } | boolean;

    /** Loose storage input accepted by browser repos. */
    export type Input = Arg | StorageAdapterInterface;
  }

  /**
   * Browser CRDT network contracts.
   */
  export namespace Network {
    /** Network connection argument. */
    export type Arg = t.Crdt.Network.WebsocketArg;

    /** Loose network input accepted by browser repos. */
    export type Input = Arg | NetworkAdapterInterface | t.Falsy;
  }
}
