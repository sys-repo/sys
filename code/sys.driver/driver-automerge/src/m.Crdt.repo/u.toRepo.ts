import { type DocumentId, isValidAutomergeUrl, Repo } from '@automerge/automerge-repo';

import { CrdtIs } from '../m.Crdt/m.Is.ts';
import { type t, Err, Is, rx, slug, Time, toRef, whenReady } from './common.ts';
import { REF } from './u.toAutomergeRepo.ts';

type O = Record<string, unknown>;
const D = { timeout: 5_000 };

/**
 * Wrap an Automerge repo in a lightweight functional API.
 */
export function toRepo(repo: Repo, options: { peerId?: string } = {}): t.CrdtRepo {
  let _updating: t.Lifecycle | undefined;
  let _enabled = true;

  const cloneProps = () => {
    const { id, sync } = api;
    return { id, sync: { ...sync } };
  };

  const $$ = rx.subject<t.CrdtRepoChange>();
  const networks = repo.networkSubsystem.adapters;
  const peer = networks.length > 0 ? options.peerId ?? '' : '';
  const urls = networks
    .filter((adapter) => 'url' in adapter && typeof (adapter as any).url === 'string')
    .map((adapter: any) => adapter.url);

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
        _updating = updateConnected(networks, peer, value);
        const after = cloneProps();
        $$.next({ before, after });
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
      const life = rx.lifecycle(dispose$);
      const $ = $$.pipe(rx.takeUntil(life.dispose$));
      return rx.toLifecycle<t.CrdtRepoEvents>(life, { $ });
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
  networks: t.NetworkAdapterInterface[],
  peer: t.StringId,
  enabled: boolean,
) {
  const life = rx.lifecycle();
  networks.forEach(async (adapter) => {
    await adapter.whenReady();
    if (life.disposed) return;
    if (enabled) adapter.connect(peer as t.PeerId, {});
    else adapter.disconnect();
  });
  return life;
}
