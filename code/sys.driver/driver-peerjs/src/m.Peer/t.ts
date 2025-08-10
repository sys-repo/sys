import type { t } from './common.ts';

/**
 * API for Peer/WebRTC related tools
 */
export type PeerLib = Readonly<{
  maintainDyadConnection: t.MaintainDyadConnection;
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
