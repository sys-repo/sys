import { type t, CrdtIs, Is } from './common.ts';
import { attachRepo } from './u.attach.repo.ts';
import { Wire } from './u.wire.ts';

type AttachMessage = {
  kind?: string;
  port?: MessagePort;
  config?: t.CrdtWorkerSpawnConfig;
};

/**
 * Install worker-side wiring for CRDT repo events.
 *
 * Supports two worker-host patterns:
 * - listen(self, repo)           ← existing repo instance
 * - listen(self, factory)        ← lazy repo creation with spawn-time config
 */
export const listen: t.CrdtWorkerLib['listen'] = (self, args) => {
  let { repo, factory } = wrangle.args(args);

  /**
   * Message handler: look for `crdt:attach` and bind the provided port.
   * If a factory was provided, lazily create the repo on first attach
   * with access to the optional spawn-time config.
   */
  self.addEventListener('message', (ev) => {
    const data = ev.data as AttachMessage | undefined;
    if (data?.kind !== Wire.Kind.attach) return;

    const port = ev.ports?.[0] ?? data.port;
    if (!port) return;

    const attach = (instance: t.CrdtRepo) => attachRepo(port, instance);

    // Repo already exists (legacy path or first attach already handled).
    if (repo) {
      attach(repo);
      return;
    }

    // Lazily create repo via factory on first attach.
    if (factory) {
      const config = data.config;
      void (async () => {
        try {
          const created = await factory({ config });
          repo = created;
          attach(created);
        } catch {
          // Swallow factory errors here: transport-level failure would be
          // surfaced via repo wiring if needed. For now we keep this silent.
        }
      })();
    }
  });

  /**
   * Signal to `CrdtWorker.spawn` that this worker has installed its
   * message handler and is ready to accept a `crdt:attach` port.
   */
  if (Is.func(self.postMessage)) self.postMessage({ kind: Wire.Kind.workerReady });
};

/**
 * Helpers:
 */
const wrangle = {
  args(input: t.CrdtRepo | t.CrdtRepoFactory) {
    const factory = Is.func(input) ? input : undefined;
    const repo = CrdtIs.repo(input) ? input : undefined;
    return { factory, repo } as const;
  },
} as const;
