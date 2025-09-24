import { c, NodeWSServerAdapter, rx, type t, Time } from './common.ts';
import { Log } from './u.print.ts';

type TInfo = { startedAt: t.UnixTimestamp; meta: t.PeerMetadata };

export function monitorPeers(
  args: {
    network: NodeWSServerAdapter;
    host: string;
    port: t.PortNumber;
    dir?: t.StringDir;
    silent?: boolean;
  },
  until?: t.UntilInput,
) {
  const { dir, host, port, network, silent } = args;
  const life = rx.lifecycle(until);

  // let total = 0;
  const peers = new Map<t.PeerId, TInfo>();

  /**
   * Logging:
   */
  const metricsLogger = Log.startInterval(life.dispose$, metrics);
  // metrics();
  function metrics() {
    const totalPeers = peers.size;
    if (!silent) Log.metrics({ dir, totalPeers, pad: true });
  }
  // metricsLogger.ping();

  if (!silent) {
    Log.server({ host, port, dir });
    metrics();
  }

  /**
   * Handlers
   */
  network.on('peer-candidate', (e) => {
    const id = e.peerId;
    peers.set(id, { startedAt: Time.now.timestamp, meta: e.peerMetadata });
    metricsLogger.ping();
    if (!silent) console.info(c.white('connected:   '), c.green(id));
  });

  network.on('peer-disconnected', (e) => {
    const id = e.peerId;
    peers.delete(id);
    metricsLogger.ping();
    if (!silent) console.info(c.gray(c.dim('disconnected:')), c.gray(id));
  });

  /**
   * API:
   */
  return {
    get total() {
      return peers.size;
    },
  } as const;
}
