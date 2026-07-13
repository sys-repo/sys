import { type t, Schedule } from '../../-test.ts';
import { Crdt } from '../../m.server/common.ts';
import { Server } from '../../m.server/mod.ts';

type EventLog = {
  readonly repo: t.CrdtRepo;
  readonly events: t.CrdtRepoEvents;
  readonly prop: t.CrdtRepoPropChange[];
  readonly network: t.CrdtNetworkChangeEvent[];
};

type NetworkFixture = {
  readonly server: t.SyncServer.Instance;
  readonly serverLog: EventLog;
  readonly createRepo: () => EventLog;
  readonly dispose: () => Promise<void>;
};

const D = { timeout: 5_000 } as const;

/** Test fixture helpers for repo event contract tests. */
export const EventsFixture = {
  D,

  async network(): Promise<NetworkFixture> {
    const repos: t.CrdtRepo[] = [];
    const server = await Server.ws({ silent: true });
    const ws = `localhost:${server.addr.port}`;
    const serverLog = collect(server.repo);

    return {
      server,
      serverLog,
      createRepo() {
        const repo = Crdt.repo({ network: { ws } });
        repos.push(repo);
        return collect(repo);
      },
      async dispose() {
        await Promise.all(repos.map((repo) => repo.dispose()));
        await server.dispose();
      },
    };
  },

  waitFor(predicate: () => boolean) {
    return Schedule.waitFor(predicate, D.timeout);
  },

  hasPeer(repo: t.CrdtRepo, peerId: string) {
    return repo.sync.peers.some((peer) => peer === peerId);
  },

  peerChanges(log: EventLog) {
    return log.prop.filter((e) => e.prop === 'sync.peers');
  },
} as const;

/**
 * Helpers:
 */
function collect(repo: t.CrdtRepo): EventLog {
  const events = repo.events();
  const prop: t.CrdtRepoPropChange[] = [];
  const network: t.CrdtNetworkChangeEvent[] = [];

  events.prop$.subscribe((e) => prop.push(e));
  events.network$.subscribe((e) => network.push(e));

  return { repo, events, prop, network };
}
