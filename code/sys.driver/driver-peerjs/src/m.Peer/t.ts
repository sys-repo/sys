import type { t } from './common.ts';

/**
 * API for Peer/WebRTC related tools:
 */
export type PeerLib = Readonly<{
  Conn: t.PeerConLib;
}>;

/**
 * Library: Peer connection tools:
 */
export type PeerConLib = Readonly<{
  /**
   * Establish a resilient "one-to-one" media link for
   * a given dyad (1:1) of peer-id’s.
   */
  maintainDyadConnection: t.MaintainDyadConnection;

  /**
   * Produce every unique, lexicographically-ordered 1-to-1
   * pairing ( PeerDyad ) from a set of peer-ids.
   */
  toDyads(peers?: t.WebRtc.PeerId[]): t.WebRtc.PeerDyad[];

  /**
   * Keep the `dyads` list in up-to-date with the current peer `group` list.
   *
   * @returns {boolean} `true` if `connections.dyads` was updated (a change was written);
   *   `false` if there were no connections or the computed dyads matched the current value.
   */
  updateDyads(dyadsPath: t.ObjectPath, doc?: t.Crdt.Ref<t.SampleDoc>): boolean;
}>;

/**
 * Establish a resilient "one-to-one" media link for
 * a given dyad (1:1) of peer-id’s.
 *
 *  @usage
 *
 *    const life = maintainDyadConnection({
 *      peer,                      // (open) PeerJS instance
 *      localStream,               // getUserMedia() result
 *      dyad: ['alice', 'bob'],    // tuple of the two IDs (order irrelevant)
 *      onRemoteStream: (e) => (videoEl.srcObject = e.remote.stream),
 *    });
 *
 *    // ... later:
 *    life.dispose();              // closes call and removes listeners.
 */
export type MaintainDyadConnection = (args: t.MaintainDyadConnectionArgs) => t.DyadConnection;
export type MaintainDyadConnectionArgs = {
  peer: t.PeerJS.Peer;
  dyad: t.WebRtc.PeerDyad;
  localStream: MediaStream;
  onRemoteStream?: RemoteStreamHandler;
  retryDelay?: t.Msecs; // initial delay for reconnect polling (ms)
  dispose$?: t.UntilInput;
};

/**
 * Fires when the remote stream becomes available.
 */
export type RemoteStreamHandler = (e: RemoteStreamArgs) => void;
export type RemoteStreamArgs = {
  readonly remote: t.SamplePeerMedia;
  readonly local: t.SamplePeerMedia;
};
