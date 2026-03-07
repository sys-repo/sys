import { type t, Err } from './common.ts';

type O = Record<string, unknown>;
type GetRepo = () => t.CrdtRepo | undefined;

export type CreateHandlersOptions = {
  /** Called when a document is successfully retrieved, allowing doc stream attachment. */
  onGetDoc?: (doc: t.CrdtRef) => void;
};

/**
 * Create a CrdtRepoError with the appropriate structure.
 */
const toRepoError = (kind: t.CrdtRepoErrorKind, message: string): t.CrdtRepoError => ({
  ...Err.std(message),
  kind,
});

/**
 * Create the handler implementations for worker-level commands.
 */
export function createHandlers(getRepo: GetRepo, options: CreateHandlersOptions = {}): t.WorkerCmdHandlers {
  const { onGetDoc } = options;

  const requireRepo = () => {
    const repo = getRepo();
    if (!repo) throw new Error('No repo available');
    return repo;
  };

  return {
    async 'repo:ready'() {
      const repo = requireRepo();
      await repo.whenReady();
      return { ready: true };
    },

    async 'repo:create'({ initial }) {
      const repo = requireRepo();
      const { doc, error } = await repo.create(initial as O);
      if (error) throw error;
      return { id: doc!.id };
    },

    async 'repo:get'({ id, options }) {
      const repo = requireRepo();
      const { doc, error } = await repo.get(id, options);
      if (error) return { error };
      if (!doc) return { error: toRepoError('NotFound', `No document for id "${id}"`) };
      onGetDoc?.(doc);
      return { doc: { id: doc.id } };
    },

    async 'repo:delete'({ id }) {
      const repo = requireRepo();
      await repo.delete(id);
      return { deleted: true };
    },

    'repo:sync.enable'({ enabled }) {
      const repo = requireRepo();
      repo.sync.enable(enabled);
      return { enabled: repo.sync.enabled };
    },
  };
}
