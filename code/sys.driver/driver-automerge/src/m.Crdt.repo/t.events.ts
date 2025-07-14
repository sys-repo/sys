import type { t } from './common.ts';
type BeforeAfter = { readonly before: t.CrdtRepoProps; readonly after: t.CrdtRepoProps };

/**
 * Event emitter for a repo.
 */
export type CrdtRepoEvents = t.Lifecycle & {
  /** Primary change event stream. */
  readonly $: t.Observable<CrdtRepoEvent>;
  readonly change$: t.Observable<CrdtRepoChangeEvent['payload']>;
  readonly network$: t.Observable<NetworkChangeEvent['payload']>;
};

/**
 * Events:
 */
export type CrdtRepoEvent = CrdtRepoChangeEvent | NetworkChangeEvent;

/**
 * Event: Repo change
 */
export type CrdtRepoChangeHandler = (e: CrdtRepoChangeEvent) => void;
/** Represents a change to the repo state. */
export type CrdtRepoChangeEvent = {
  type: 'repo-change';
  payload: { kind: 'enabled' } & BeforeAfter;
};

/**
 * Event: Repo network changed.
 */
export type CrdtNetworkChangeHandler = (e: NetworkChangeEvent) => void;
/**
 * Describes a network-level change we care about:
 * – `peer-online`  : new peer became reachable.
 * – `peer-offline` : peer went away.
 * – `adapter-close`: whole adapter closed/shutdown.
 */
export type NetworkChangeEvent = {
  type: 'network-change';
  payload:
    | { kind: 'peer-online'; peerId: t.PeerId; metadata?: t.PeerMetadata }
    | { kind: 'peer-offline'; peerId: t.PeerId }
    | { kind: 'adapter-close'; adapter: t.NetworkAdapterInterface };
};
