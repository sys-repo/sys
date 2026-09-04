import { type DocumentId, isValidAutomergeUrl, type Repo } from '@automerge/automerge-repo';
import { CrdtIs } from '../m.Crdt/m.Is.ts';

import { Delete, Err, Rx, Schedule, slug, type t, Time, toRef, whenReady } from './common.ts';
import { eventsFactory } from './u.events.ts';
import { monitorNetwork } from './u.monitorNetwork.ts';
import { silentShutdown } from './u.shutdown.ts';
import { REF } from './u.toAutomergeRepo.ts';

type Seeded<T extends O> = T & { readonly ['.meta']?: t.Crdt.SysMeta };
type O = Record<string, unknown>;

const D = { timeout: 5_000 } as const;

/**
 * Wrap an Automerge repo in a lightweight functional API.
 * - All outward events are emitted on a scheduled hop to avoid re-entrancy.
 */
export function toRepo(
  repo: Repo,
  options: { peerId?: string; stores?: t.CrdtRepoStoreInfo[]; until?: t.UntilInput } = {},
): t.CrdtRepo {
  let _enabled = true;
  let _ready = false;
  const peers = new Set<t.PeerId>();
  let life: t.LifecycleAsync | undefined;

  const cleanup = async () => {
    peers.clear();
    await silentShutdown(repo);
  };

  try {
    const lifecycle = Rx.lifecycleAsync(options.until, cleanup);
    life = lifecycle;
    const schedule = Schedule.make(lifecycle, 'micro');

    const cloneProps = (): t.CrdtRepoProps => {
      const { id, stores, status } = api;
      const sync = Delete.undefined({ ...api.sync, enable: undefined }); // NB: ensure method does not leak onto pure DTO props.
      return { id, sync, status, stores: [...stores] };
    };

    /**
     * Observable (scheduled emissions):
     */
    const $$ = Rx.subject<t.CrdtRepoEvent>();
    const emitAsync = (e: t.CrdtRepoEvent) => schedule(() => $$.next(e));
    const fireChanged = (
      prop: t.CrdtRepoPropChange['prop'],
      before: t.CrdtRepoProps,
      after: t.CrdtRepoProps = cloneProps(),
    ) => emitAsync({ type: 'props/change', payload: { prop, before, after } });

    /**
     * State:
     */
    const adapters = repo.networkSubsystem.adapters;
    const peer = adapters.length > 0 ? (options.peerId ?? '') : '';
    const peerId = peer as t.PeerId;
    const urls = adapters
      .filter((adapter) => 'url' in adapter && typeof (adapter as any).url === 'string')
      .map((adapter: any) => adapter.url);

    const initializeReady = async () => {
      try {
        await Promise.all(adapters.map((a) => a.whenReady()));
      } catch {
        /* NB: some adapters may not implement strictly */
      }
      await schedule();
      if (!_ready) {
        const before = cloneProps();
        _ready = true;
        fireChanged('status', before);
      }
    };

    /**
     * Helpers:
     */
    const toggleAdapters = async (enabled: boolean) => {
      // Hop off the caller's stack so lifecycle edges (dispose, enable/disable)
      // are always observed from a clean microtask.
      await schedule();

      for (const adapter of adapters as t.NetworkAdapterInterface[]) {
        if (lifecycle.disposed) break;
        try {
          // Wait until the adapter has finished any internal initialization.
          await adapter.whenReady();
          if (lifecycle.disposed) break;

          if (enabled) {
            adapter.connect(peerId, {});
          } else {
            // Normalize sync/async disconnect to a single awaitable.
            await Promise.resolve(adapter.disconnect?.());
          }
        } catch {
          /**
           * Swallow benign races / pre-open teardown errors:
           * - WebSocket closed before fully open
           * - whenReady() rejecting due to concurrent dispose
           *
           * Domain-level failures are surfaced via repo events; adapter
           * connect/disconnect should never crash the process or test runner.
           */
        }
      }
    };

    /**
     * API:
     */
    const api: t.CrdtRepo = {
      id: { peer, instance: `repo-${slug()}` },
      get status(): t.CrdtRepoStatus {
        return { ready: _ready, stalled: false };
      },

      async whenReady() {
        await readyOnce;
        return api;
      },

      sync: {
        urls,
        get peers() {
          return Array.from(peers);
        },
        get enabled() {
          if (urls.length === 0) return null;
          return _enabled;
        },
        enable(value = true) {
          if (value === _enabled) return;
          const before = cloneProps();
          _enabled = value;
          void toggleAdapters(_enabled);
          fireChanged('sync.enabled', before);
        },
      },
      get stores() {
        return options.stores ?? [];
      },

      create<T extends O>(input: T | (() => T)) {
        try {
          const initial = seedInitial<T>(input);
          const handle = repo.create<T>(initial);
          const doc = toRef(handle);
          return Promise.resolve({ ok: true, doc } as const);
        } catch (error) {
          return Promise.reject(error);
        }
      },

      get<T extends O>(id: t.Crdt.Id, options: t.CrdtRepoGetOptions = {}) {
        type R = t.CrdtRefResult<T>;
        return new Promise<R>((resolve) => {
          const fail = (error: t.CrdtRepoError) => resolve({ ok: false, error });
          let timeout: ReturnType<typeof Time.delay> | undefined;
          id = wrangle.id(id);

          const onError = (err: any) => {
            timeout?.cancel();
            const message = err?.message ?? '';
            if (message.includes('is unavailable')) return fail(wrangle.error('NotFound', message));
            return fail(wrangle.error('UNKNOWN', err));
          };

          try {
            const msecs = options.timeout ?? D.timeout;
            timeout = Time.delay(msecs, () => {
              const error = wrangle.error(
                'Timeout',
                Err.std(`Timed out retrieving document ${id}`),
              );
              return fail(error);
            });

            void repo
              .find<T>(id as DocumentId)
              .then(async (handle) => {
                await handle.whenReady();
                const doc = toRef(handle);

                timeout?.cancel();
                if (!timeout?.is.completed) resolve({ ok: true, doc });
              })
              .catch(onError);
          } catch (err) {
            onError(err);
          }
        });
      },

      async delete(input) {
        const doc = CrdtIs.ref(input) ? input : (await api.get(input)).doc;
        if (doc) {
          if (doc.deleted || doc.disposed) return;
          await whenReady(doc);
          if (!doc.deleted && !doc.disposed) repo.delete(doc.id as DocumentId);
        }
      },

      events(dispose$) {
        const until = Rx.lifecycle([dispose$, lifecycle.dispose$]);
        return eventsFactory($$, until);
      },

      dispose: lifecycle.dispose,
      [Symbol.asyncDispose]: lifecycle[Symbol.asyncDispose],
      get dispose$() {
        return lifecycle.dispose$;
      },
      get disposed() {
        return lifecycle.disposed;
      },
    };

    // Hidden reference (automerge).
    Object.defineProperty(api, REF, {
      value: repo,
      writable: false,
      enumerable: false,
      configurable: false,
    });

    /**
     * Listeners (network → scheduled):
     */
    monitorNetwork(adapters, lifecycle.dispose$, (e) => {
      emitAsync(e);
      if (e.type === 'network/peer-online' || e.type === 'network/peer-offline') {
        const before = cloneProps();
        if (e.type === 'network/peer-online') peers.add(e.payload.peerId);
        if (e.type === 'network/peer-offline') peers.delete(e.payload.peerId);
        fireChanged('sync.peers', before);
      }
    });

    const readyOnce = initializeReady();
    return api;
  } catch (error) {
    const rollback = life ? life.dispose(error) : cleanup();
    void rollback.catch(() => undefined);
    throw error;
  }
}

/**
 * Helpers:
 */
const wrangle = {
  id(input: string | t.CrdtRef<O>): DocumentId {
    let id = CrdtIs.ref(input) ? input.id : input;
    if (typeof id !== 'string') return '' as DocumentId;
    id = id.trim();
    id = id.replace(/^crdt\:/, '');
    id = isValidAutomergeUrl(id) ? id.replace(/^automerge\:/, '') : id;
    return id as DocumentId;
  },

  error(kind: t.CrdtRepoErrorKind, err: any): t.CrdtRepoError {
    const res = Err.std(err);
    return { ...res, kind };
  },
} as const;

/**
 * Guarantee docs are non-empty so they persist durably.
 * Adds `['.meta'].createdAt` if initial state is empty.
 */
const seedInitial = <T extends O>(input: T | (() => T)): Seeded<T> => {
  const base = (typeof input === 'function' ? (input as () => T)() : input) ?? {};
  if (Object.keys(base).length > 0) return base as Seeded<T>;
  return { ['.meta']: { createdAt: Time.now.timestamp } } as Seeded<T>;
};
