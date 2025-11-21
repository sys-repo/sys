/**
 * Functional subset of the underlying Automerge type system.
 */
export namespace Automerge {
  // Crdt:
  export type Patch = import('@automerge/automerge').Patch;
  export type PatchSource = import('@automerge/automerge').PatchSource;

  // Repo:
  export type Url = import('@automerge/automerge-repo').AutomergeUrl;
  export type DocHandle<T> = import('@automerge/automerge-repo').DocHandle<T>;
  export type DocumentId = import('@automerge/automerge-repo').DocumentId;
  export type NetworkAdapterInterface = import('@automerge/automerge-repo').NetworkAdapterInterface;
  export type PeerId = import('@automerge/automerge-repo').PeerId;
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
