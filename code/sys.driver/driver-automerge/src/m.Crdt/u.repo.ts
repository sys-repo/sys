import { type DocumentId, isValidAutomergeUrl, Repo } from '@automerge/automerge-repo';
import { type t, Err, Is, slug, Time } from './common.ts';
import { CrdtIs } from './m.Is.ts';
import { toRef } from './u.ref.ts';

type O = Record<string, unknown>;
const REF = Symbol('ref:handle');
const D = { timeout: 5_000 };

/**
 * Extract the hidden automerge Repo from a [CrdtRepo].
 */
export function toAutomergeRepo(repo?: t.CrdtRepo): Repo | undefined {
  if (!repo) return;
  return (repo as any)[REF];
}

/**
 * Wrap an Automerge repo in a lightweight functional API.
 */
export function toRepo(repo: Repo, options: { peerId?: string } = {}): t.CrdtRepo {
  let _enabled = true;
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
        _enabled = value;
        networks.forEach((adapter) => {
          if (value) adapter.connect(peer as t.PeerId, {});
          else adapter.disconnect();
        });
      },
    },

    create<T extends O>(input: T | (() => T)) {
      const initial = Is.func(input) ? input() : input;
      const handle = repo.create<T>(initial);
      return toRef(handle);
    },

    get<T extends O>(id: t.StringId, options: t.CrdtRepoGetOptions = {}) {
      return new Promise<t.CrdtRepoGetResponse<T>>(async (resolve) => {
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
    id = isValidAutomergeUrl(id) ? id.replace(/^automerge\:/, '') : id;
    return id as DocumentId;
  },

  error(kind: t.CrdtRepoErrorKind, err: any): t.CrdtRepoError {
    const res = Err.std(err);
    return { ...res, kind };
  },
} as const;
