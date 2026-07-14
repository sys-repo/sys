/**
 * Functional subset of the underlying Automerge type system.
 */
export namespace Automerge {
  // Crdt:
  /** Automerge patch payload. */
  export type Patch = import('@automerge/automerge').Patch;
  /** Automerge patch source metadata. */
  export type PatchSource = import('@automerge/automerge').PatchSource;

  // Repo:
  /** Automerge repository document URL. */
  export type Url = import('@automerge/automerge-repo').AutomergeUrl;
  /** Automerge document handle. */
  export type DocHandle<T> = import('@automerge/automerge-repo').DocHandle<T>;
  /** Automerge document id. */
  export type DocumentId = import('@automerge/automerge-repo').DocumentId;
  /** Automerge network adapter interface. */
  export type NetworkAdapterInterface = import('@automerge/automerge-repo').NetworkAdapterInterface;
  /** Automerge peer id. */
  export type PeerId = import('@automerge/automerge-repo').PeerId;
  /** Automerge storage adapter interface. */
  export type StorageAdapterInterface = import('@automerge/automerge-repo').StorageAdapterInterface;
}

export type {
  AutomergeUrl,
  DocHandle,
  DocumentId,
  NetworkAdapterInterface,
  PeerCandidatePayload,
  PeerDisconnectedPayload,
  PeerId,
  PeerMetadata,
  Repo,
  StorageAdapterInterface,
} from '@automerge/automerge-repo';
