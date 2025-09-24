import { c, NodeWSServerAdapter, rx, type t, Time } from './common.ts';
import { Log } from './u.print.ts';

type TInfo = {
  meta: t.PeerMetadata;
  startedAt: t.UnixTimestamp;
  lastSeenAt: t.UnixTimestamp;
  lastSeenKind: 'connect' | 'message-in' | 'message-out' | 'disconnect';
};

export const IdlePolicy = {
  soft: 60_000, //    60s
  stale: 180_000, //  3m
  dead: 600_000, //   10m
} as const;

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
  const peers = new Map<t.PeerId, TInfo>();

  const now = () => Time.now.timestamp;
  const touch = (id: t.PeerId, kind: TInfo['lastSeenKind']) => {
    const info = peers.get(id);
    if (!info) return;
    info.lastSeenAt = now();
    info.lastSeenKind = kind;
  };

  /**
   * Logging:
   */
  const metricsLogger = Log.startInterval(life.dispose$, metrics);
  function metrics() {
    const totalPeers = peers.size;
    if (!silent) Log.metrics({ dir, totalPeers, pad: true });
  }

  if (!silent) {
    Log.server({ host, port, dir });
    metrics();
  }

  /**
   * Handlers:
   */
  network.on('peer-candidate', (e) => {
    const id = e.peerId;
    peers.set(id, {
      meta: e.peerMetadata,
      startedAt: now(),
      lastSeenAt: now(),
      lastSeenKind: 'connect',
    });
    metricsLogger.ping();
    if (!silent) console.info(c.white('connected:   '), c.green(id));
  });

  network.on('peer-disconnected', (e) => {
    const id = e.peerId;
    touch(id, 'disconnect');
    peers.delete(id);
    metricsLogger.ping();
    if (!silent) console.info(c.gray(c.dim('disconnected:')), c.gray(id));
  });

  network.on('message', (e) => {
    const { senderId, targetId } = e;
    if (senderId) touch(senderId, 'message-out');
    if (targetId) touch(targetId, 'message-in');
  });

  /**
   * API:
   */
  const api = {
    get total(): t.SyncServerInfo['total'] {
      return {
        connections: peers.size,
        idle: {
          soft: api.stale(IdlePolicy.soft).length,
          stale: api.stale(IdlePolicy.stale).length,
          dead: api.stale(IdlePolicy.dead).length,
        },
      };
    },
    get peers() {
      return Object.fromEntries(peers);
    },
    stale(ms: t.Msecs): readonly t.PeerId[] {
      const cutoff = now() - ms;
      const out: t.PeerId[] = [];
      for (const [id, info] of peers) {
        if (info.lastSeenAt <= cutoff) out.push(id);
      }
      return out;
    },
  } as const;

  return api;
}
