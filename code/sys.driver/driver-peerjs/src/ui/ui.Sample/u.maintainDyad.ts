import { type t, rx } from './common.ts';

/**
 * Resilient “one-to-one” media link for a given dyad of peer-id’s.
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
 *    // … later:
 *    life.dispose();              // closes call and removes listeners.
 */
type Args = {
  peer: t.PeerJS.Peer;
  dyad: t.WebRtc.PeerDyad;
  localStream: MediaStream;
  onRemoteStream?: RemoteStreamHandler;
  retryDelay?: t.Msecs; // initial delay for reconnect polling (ms)
  dispose$?: t.UntilInput;
};

export type RemoteStreamHandler = (e: RemoteStreamArgs) => void;
export type RemoteStreamArgs = {
  readonly remote: t.SamplePeerMedia;
  readonly local: t.SamplePeerMedia;
};

/**
 * Establishes — and keeps alive — a single media connection between the
 * two peer-ids in `dyad`, regardless of *which side starts first*.
 *
 * • Both sides poll-dial until *exactly one* link is up.
 * • If the link drops, polling restarts with capped exponential back-off
 *   (1 s → 2 s → 4 s … max 30 s).
 * • Duplicate or stale connections are pruned automatically.
 */
export function maintainDyadConnection(args: Args): t.Lifecycle {
  const { peer, dyad, localStream, onRemoteStream, retryDelay = 1_000 } = args;

  /** `life` – external + internal disposal channel. */
  const life = rx.lifecycle(args.dispose$);

  if (!peer.id) throw new Error('Peer instance must be “open” first');

  const [id1, id2] = dyad;
  const remoteId = peer.id === id1 ? id2 : id1;

  let call: t.PeerJS.MediaConnection | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let delay = retryDelay; // exponential back-off tracker

  /**
   * Attempt to place an outbound call (poller).
   */
  const dial = () => {
    console.log('DIAL', call);
    if (life.disposed || call) return; // already connected
    try {
      const outgoing = peer.call(remoteId, localStream);
      if (outgoing) IO.wireCall(outgoing);
    } catch {
      scheduleRetry();
    }
  };

  /**
   * Schedule next dial attempt with exponential back-off.
   */
  const scheduleRetry = () => {
    if (life.disposed || timer || call) return;
    timer = setTimeout(() => {
      timer = null;
      dial();
      delay = Math.min(delay * 2, 30_000);
    }, delay);
  };

  /**
   * Connection I/O:
   */
  const IO = {
    /**
     * Attach housekeeping listeners to a MediaConnection.
     */
    wireCall(c: t.PeerJS.MediaConnection) {
      IO.cleanupCall(); // ensure single active link
      call = c;

      const lost = () => IO.lostConnection(c);
      const handleIce = (state: string) => {
        if (state === 'disconnected' || state === 'failed' || state === 'closed') lost();
      };

      c.on('stream', Handle.stream);
      c.on('close', lost);
      c.on('error', lost);
      (c as any).on?.('iceStateChanged', handleIce);

      // When this connection is ultimately closed, remove listeners.
      const detach = () => {
        c.off('stream', Handle.stream);
        c.off('close', lost);
        c.off('error', lost);
        (c as any).off?.('iceStateChanged', handleIce);
      };
      c.once?.('close', detach);
      c.once?.('error', detach);
    },

    /**
     * Connection lost → begin polling again (only if this call died).
     */
    lostConnection(conn?: t.PeerJS.MediaConnection) {
      if (conn && conn !== call) return; // (ignore): stale/duplicate close.
      IO.cleanupCall();
      scheduleRetry();
    },

    /**
     * Tear down current call (no retry).
     */
    cleanupCall() {
      if (!call) return;
      try {
        call.close();
      } catch {
        /* noop */
      }
      call = null;
    },
  } as const;

  /**
   * Event handlers:
   */
  const Handle = {
    /**
     * Remote stream received → alert listeners.
     */
    stream(stream: MediaStream) {
      delay = retryDelay; // success → reset back-off
      onRemoteStream?.({
        local: { stream: localStream, peer: peer.id },
        remote: { stream, peer: remoteId },
      });
    },

    /**
     * Inbound call handler — answer if it's from the expected peer.
     */
    incoming(incoming: t.PeerJS.MediaConnection) {
      if (incoming.peer !== remoteId || life.disposed) return;
      IO.wireCall(incoming); // Becomes the active link.
      try {
        incoming.answer(localStream);
      } catch {
        /* Already answered. */
      }
    },

    /**
     * Signalling socket dropped — ask PeerJS to reconnect.
     */
    disconnect() {
      if (life.disposed) return;
      try {
        peer.reconnect();
      } catch {
        /* noop */
      }
    },
  } as const;

  /**
   * Dispose:
   */
  life.dispose$.subscribe(() => {
    if (life.disposed) return;
    if (timer) clearTimeout(timer);
    IO.cleanupCall();
    peer.off('call', Handle.incoming);
    peer.off('disconnected', Handle.disconnect);
  });

  /**
   * Initialize:
   */
  peer.on('call', Handle.incoming);
  peer.on('disconnected', Handle.disconnect);
  dial(); // Start polling immediately.

  // Finish up.
  return life;
}
