import { type DocumentId, isValidAutomergeUrl, Repo } from '@automerge/automerge-repo';

import { CrdtIs } from '../m.Crdt/m.Is.ts';
import { type t, Err, Is, rx, slug, Time, toRef, whenReady } from './common.ts';
import { eventsFactory } from './u.events.ts';
import { monitorNetwork } from './u.monitorNetwork.ts';
import { REF } from './u.toAutomergeRepo.ts';

type O = Record<string, unknown>;
const D = { timeout: 5_000 } as const;

/**
 * Wrap an Automerge repo in a lightweight functional API.
 */
export function toRepo(
  repo: Repo,
  options: { peerId?: string; dispose$?: t.UntilInput } = {},
): t.CrdtRepo {
  const life = rx.lifecycleAsync(options.dispose$, () => repo.shutdown());
  let _updating: t.Lifecycle | undefined;
  let _enabled = true;

  /**
   * State:
   */
  const $$ = rx.subject<t.CrdtRepoEvent>();
  const adapters = repo.networkSubsystem.adapters;
  const peer = adapters.length > 0 ? options.peerId ?? '' : '';
  const urls = adapters
    .filter((adapter) => 'url' in adapter && typeof (adapter as any).url === 'string')
    .map((adapter: any) => adapter.url);

  /**
   * Listeners:
   */
  monitorNetwork(adapters, life.dispose$, (e) => {
    $$.next(e);

  });

  /**
   * Helpers:
   */
  const cloneProps = () => {
    const { id, sync } = api;
    return { id, sync: { ...sync } };
  };

  /**
   * API:
   */
  const api: t.CrdtRepo = {
    id: { peer, instance: slug() },

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
        _updating?.dispose?.();
        _updating = updateConnected(adapters, peer, value);
        const after = cloneProps();
        $$.next({ type: 'prop-change', payload: { prop: 'enabled', before, after } });
      },
    },

    create<T extends O>(input: T | (() => T)) {
      const initial = Is.func(input) ? input() : input;
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

    /**
     * Lifecycle:
     */
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

  // Finish up.
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
    id = isValidAutomergeUrl(id) ? id.replace(/^automerge\:/, '') : id;
    return id as DocumentId;
  },

  error(kind: t.CrdtRepoErrorKind, err: any): t.CrdtRepoError {
    const res = Err.std(err);
    return { ...res, kind };
  },
} as const;

/**
 * Safely connects/disconnects to each network adapter.
 */
function updateConnected(
  adapters: t.NetworkAdapterInterface[],
  peer: t.StringId,
  enabled: boolean,
) {
  const life = rx.lifecycle();
  adapters.forEach(async (adapter) => {
    await adapter.whenReady();
    if (life.disposed) return;
    if (enabled) adapter.connect(peer as t.PeerId, {});
    else adapter.disconnect();
  });
  return life;
}
