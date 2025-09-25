import { type DocumentId, isValidAutomergeUrl, Repo } from '@automerge/automerge-repo';
import { CrdtIs } from '../m.Crdt/m.Is.ts';

import { type t, Err, rx, Scheduler, slug, Time, toRef, whenReady } from './common.ts';
import { eventsFactory } from './u.events.ts';
import { monitorNetwork } from './u.monitorNetwork.ts';
import { silentShutdown } from './u.shutdown.ts';
import { REF } from './u.toAutomergeRepo.ts';

type SysMeta = { readonly createdAt: number };
type Seeded<T extends O> = T & { readonly $meta?: SysMeta };
type O = Record<string, unknown>;

const D = { timeout: 5_000 } as const;

/**
 * Wrap an Automerge repo in a lightweight functional API.
 * - All outward events are emitted on a scheduled hop to avoid re-entrancy.
 */
export function toRepo(
  repo: Repo,
  options: { peerId?: string; dispose$?: t.UntilInput } = {},
): t.CrdtRepo {
  let _enabled = true;
  let _ready = false;

  async function cleanup() {
    peers.clear();
    await silentShutdown(repo);
  }
  const life = rx.lifecycleAsync(options.dispose$, cleanup);
  const schedule = Scheduler.make(life, 'micro');

  const cloneProps = (): t.CrdtRepoProps => {
    const { id, sync, ready } = api;
    return { id, sync: { ...sync }, ready };
  };

  /**
   * Observable (scheduled emissions):
   */
  const $$ = rx.subject<t.CrdtRepoEvent>();
  const emitAsync = (e: t.CrdtRepoEvent) => schedule(() => $$.next(e));
  const fireChanged = (
    prop: t.CrdtRepoPropChange['prop'],
    before: t.CrdtRepoProps,
    after: t.CrdtRepoProps = cloneProps(),
  ) => emitAsync({ type: 'prop-change', payload: { prop, before, after } });

  /**
   * State:
   */
  const adapters = repo.networkSubsystem.adapters;
  const peer = adapters.length > 0 ? (options.peerId ?? '') : '';
  const peerId = peer as t.PeerId;
  const peers = new Set<t.PeerId>();
  const urls = adapters
    .filter((adapter) => 'url' in adapter && typeof (adapter as any).url === 'string')
    .map((adapter: any) => adapter.url);

  const readyOnce = (async () => {
    try {
      await Promise.all(adapters.map((a) => a.whenReady()));
    } catch {
      /* NB: some adapters may not implement strictly */
    }
    await schedule();
    if (!_ready) {
      const before = cloneProps();
      _ready = true;
      fireChanged('ready', before);
    }
  })();

  /**
   * Listeners (network → scheduled):
   */
  monitorNetwork(adapters, life.dispose$, (e) => {
    emitAsync(e);
    if (e.type === 'network/peer-online' || e.type === 'network/peer-offline') {
      const before = cloneProps();
      if (e.type === 'network/peer-online') peers.add(e.payload.peerId);
      if (e.type === 'network/peer-offline') peers.delete(e.payload.peerId);
      fireChanged('sync.peers', before);
    }
  });

  /**
   * Helpers:
   */
  const toggleAdapters = async (enabled: boolean) => {
    await schedule(); // hop off caller's stack
    for (const a of adapters) {
      try {
        await a.whenReady();
        if (life.disposed) return;
        if (enabled) a.connect(peerId, {});
        else (a as { disconnect?: () => void }).disconnect?.();
      } catch {
        /* swallow benign races/pre-open throws */
      }
    }
  };

  /**
   * API:
   */
  const api: t.CrdtRepo = {
    id: { peer, instance: slug() },

    get ready() {
      return _ready;
    },
    async whenReady() {
      await readyOnce;
    },

    sync: {
      urls,
      get enabled() {
        if (urls.length === 0) return false;
        return _enabled;
      },
      set enabled(value) {
        if (value === _enabled) return;
        const before = cloneProps();
        _enabled = value;
        void toggleAdapters(_enabled);
        fireChanged('sync.enabled', before);
      },
      get peers() {
        return Array.from(peers);
      },
    },

    create<T extends O>(input: T | (() => T)) {
      const initial = seedInitial<T>(input);
      const handle = repo.create<T>(initial);
      return toRef(handle);
    },

    get<T extends O>(id: t.StringId, options: t.CrdtRepoGetOptions = {}) {
      type R = t.CrdtRefGetResponse<T>;
      return new Promise<R>(async (resolve) => {
        const fail = (error: t.CrdtRepoError) => resolve({ error });
        id = wrangle.id(id);

        try {
          const msecs = options.timeout ?? D.timeout;
          const timeout = Time.delay(msecs, () => {
            const error = wrangle.error('Timeout', Err.std(`Timed out retrieving document ${id}`));
            return fail(error);
          });

          const handle = await repo.find<T>(id as DocumentId);
          await handle.whenReady();
          const doc = toRef(handle);

          timeout.cancel();
          if (!timeout.is.completed) resolve({ doc });
        } catch (err: any) {
          const message = err?.message ?? '';
          if (message.includes('is unavailable')) return fail(wrangle.error('NotFound', message));
          return fail(wrangle.error('UNKNOWN', err));
        }
      });
    },

    async delete(input) {
      const doc = CrdtIs.ref(input) ? input : (await api.get(input)).doc;
      if (doc) {
        if (doc.deleted || doc.disposed) return;
        await whenReady(doc);
        if (!doc.deleted && !doc.disposed) repo.delete(doc.id as t.DocumentId);
      }
    },

    events(dispose$) {
      const until = rx.lifecycle([dispose$, life.dispose$]);
      return eventsFactory($$, until);
    },

    dispose: life.dispose,
    get dispose$() {
      return life.dispose$;
    },
    get disposed() {
      return life.disposed;
    },
  };

  // Hidden reference (automerge).
  Object.defineProperty(api, REF, {
    value: repo,
    writable: false,
    enumerable: false,
    configurable: false,
  });

  return api;
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
 * Adds `$meta.createdAt` if initial state is empty.
 */
const seedInitial = <T extends O>(input: T | (() => T)): Seeded<T> => {
  const base = (typeof input === 'function' ? (input as () => T)() : input) ?? {};
  if (Object.keys(base).length > 0) return base as Seeded<T>;
  return { $meta: { createdAt: Time.now.timestamp } } as Seeded<T>;
};
