import { type t, rx } from './common.ts';

/**
 * Resilient "one-to-one" video link for a given dyad of peer-id's.
 *
 *  @usage
 *
 *   const conn = maintainDyadConnection({
 *      peer,               // your (already-created) PeerJS instance
 *      localStream,        // getUserMedia() result
 *      dyad: ['alice', 'bob'], // alphabetically-sorted tuple of the two IDs
 *      onRemoteStream: (s) => videoEl.srcObject = s,
 *   });
 *
 *    // (later):
 *
 *    conn.dispose(); // close call and removes listeners.
 */
type Args = {
  peer: t.PeerJS.Peer;
  dyad: t.WebRtc.PeerDyad;
  localStream: MediaStream;
  onRemoteStream?: RemoteStreamHandler;
  retryDelay?: t.Msecs; // delay between reconnect attempts (ms).
  dispose$?: t.UntilInput;
};

export type RemoteStreamHandler = (e: RemoteStreamArgs) => void;
export type RemoteStreamArgs = {
  readonly remote: t.SamplePeerMedia;
  readonly local: t.SamplePeerMedia;
};

/**
 * Establishes and keeps alive a single media connection between the
 * two peer-ids in `dyad`.
 * The lexicographically first id is always the **caller**; the other waits
 * for the incoming call.
 *
 * Returns a disposer you can invoke to tear everything down cleanly.
 */
export function maintainDyadConnection(args: Args): t.Lifecycle {
  const { peer, localStream, dyad, onRemoteStream, retryDelay = 1_000 } = args;
  const [a, b] = dyad;
  const life = rx.lifecycle(args.dispose$);

  if (!peer.id) throw new Error('Peer instance must be open before calling');

  const isCaller = peer.id === a;
  const remoteId = isCaller ? b : a;
  let call: t.PeerJS.MediaConnection | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Helper: start (or restart) the outbound call.
   */
  const dial = () => {
    if (life.disposed || !isCaller) return;
    cleanupCall();
    try {
      call = peer.call(remoteId, localStream);
      if (call) wireCall(call);
    } catch {
      scheduleRetry();
    }
  };

  const handleIncomingStream = (stream: MediaStream) => {
    onRemoteStream?.({
      local: { stream: localStream, peer: peer.id },
      remote: { stream, peer: remoteId },
    });
  };

  /**
   * Helper: attach listeners to a MediaConnection.
   */
  const wireCall = (c: t.PeerJS.MediaConnection) => {
    c.on('stream', handleIncomingStream);
    c.on('close', scheduleRetry);
    c.on('error', scheduleRetry);
  };

  /** Helper: clear the current MediaConnection (no retry). */
  const cleanupCall = () => {
    if (call) {
      call.off('stream', handleIncomingStream);
      call.off('close', scheduleRetry);
      call.off('error', scheduleRetry);
      call.close();
      call = null;
    }
  };

  /** Helper: retry (once) after a short delay. */
  const scheduleRetry = () => {
    if (life.disposed || timer) return;
    timer = setTimeout(() => {
      timer = null;
      dial();
    }, retryDelay);
  };

  /** Inbound call handler (for the callee side). */
  const handleIncoming = (incoming: t.PeerJS.MediaConnection) => {
    if (incoming.peer !== remoteId || life.disposed) return;
    cleanupCall(); // replaces any stale connection.
    incoming.answer(localStream);
    call = incoming;
    wireCall(incoming);
  };

  // Wire up inbound-call listener.
  peer.on('call', handleIncoming);

  // Kick-off outbound call if we are the caller.
  if (isCaller) dial();

  /**
   * Public disposal
   */
  life.dispose$.subscribe(() => {
    if (life.disposed) return;
    if (timer) clearTimeout(timer);
    cleanupCall();
    peer.off('call', handleIncoming);
  });

  return life;
}
