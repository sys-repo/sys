import { type t, rx } from './common.ts';

/**
 * Sets up listeners for tracking an aggregate of peer's network events.
 */
export function monitorNetwork(
  adapters: t.NetworkAdapterInterface[],
  dispose$: t.UntilInput,
  onChange: t.CrdtNetworkChangeHandler,
) {
  const life = rx.lifecycle(dispose$);
  const disposers: Array<() => void> = [];

  for (const adapter of adapters) {
    /**
     * Event Handlers:
     */
    const handlePeerOnline = ({ peerId, peerMetadata }: t.PeerCandidatePayload) => {
      onChange({
        type: 'network-change',
        payload: { kind: 'peer-online', peerId, metadata: peerMetadata },
      });
    };

    const handlePeerOffline = ({ peerId }: t.PeerDisconnectedPayload) => {
      onChange({
        type: 'network-change',
        payload: { kind: 'peer-offline', peerId },
      });
    };

    const handleAdapterClose = () => {
      onChange({
        type: 'network-change',
        payload: { kind: 'adapter-close', adapter },
      });
    };

    /**
     * Wire-up / tear-down.
     */
    adapter.on('peer-candidate', handlePeerOnline);
    adapter.on('peer-disconnected', handlePeerOffline);
    adapter.on('close', handleAdapterClose);
    disposers.push(() => {
      adapter.off('peer-candidate', handlePeerOnline);
      adapter.off('peer-disconnected', handlePeerOffline);
      adapter.off('close', handleAdapterClose);
    });
  }

  // Finish up.
  life.dispose$.subscribe(() => disposers.forEach((d) => d()));
  return life;
}
