import type { t } from './common.ts';

/**
 * Event emitter for a repo.
 */
export type CrdtRepoEvents = t.Lifecycle & {
  /** Primary change event stream. */
  readonly $: t.Observable<CrdtRepoEvent>;
  /** Stream of property change events. */
  readonly prop$: t.Observable<CrdtRepoPropChangeEvent['payload']>;
  /**
   * Emits once when the repo becomes ready, then completes.
   * For continuous state, use `repo.ready` or `repo.prop$`.
   */
  readonly ready$: t.Observable<boolean>;
  /** Stream of network events. */
  readonly network$: t.Observable<CrdtNetworkChangeEvent>;
};

/**
 * Events:
 */
export type CrdtRepoEvent = CrdtRepoPropChangeEvent | CrdtNetworkChangeEvent;

/**
 * Event: Repo property change
 */
export type CrdtRepoPropChangeHandler = (e: CrdtRepoPropChangeEvent) => void;
/** Represents a change to the repo state (event). */
export type CrdtRepoPropChangeEvent = {
  type: 'prop-change';
  payload: CrdtRepoPropChange;
};
/** Represents a change to the repo state. */
export type CrdtRepoPropChange = {
  readonly prop: 'ready' | 'sync.enabled' | 'sync.peers';
  readonly before: t.CrdtRepoProps;
  readonly after: t.CrdtRepoProps;
};

/**
 * Event: Describes a network-level change to the repo.
 */
export type CrdtNetworkChangeHandler = (e: CrdtNetworkChangeEvent) => void;
/** Describes a network-level change to the repo (payload). */
export type CrdtNetworkChangeEvent =
  | CrdtNetworkPeerOnlineEvent
  | CrdtNetworkPeerOfflineEvent
  | CrdtNetworkCloseEvent;

/** New peer becomes available (event). */
export type CrdtNetworkPeerOnlineEvent = {
  type: 'network/peer-online';
  payload: CrdtNetworkPeerOnline;
};
/** New peer becomes available. */
export type CrdtNetworkPeerOnline = { peerId: t.PeerId; metadata?: t.PeerMetadata };

/** Peer went away (event). */
export type CrdtNetworkPeerOfflineEvent = {
  type: 'network/peer-offline';
  payload: CrdtNetworkPeerOffline;
};
/** Peer went away. */
export type CrdtNetworkPeerOffline = { peerId: t.PeerId };

/** Whole network adapter closed/shutdown (event). */
export type CrdtNetworkCloseEvent = {
  type: 'network/close';
  payload: CrdtNetworkClose;
};
/** Whole network adapter closed/shutdown. */
export type CrdtNetworkClose = { adapter: t.NetworkAdapterInterface };
