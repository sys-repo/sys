import { type t, Rx } from './common.ts';

type O = Record<string, unknown>;

/**
 * Factory: repo shim (phase-1).
 * - Preserves the `t.CrdtRepo` surface.
 * - Mutations throw "NotImplemented".
 * - Lifecycle is real (dispose$/dispose) using Rx helpers.
 */
export const createRepo: t.CrdtWorkerLib['repo'] = (port: MessagePort, opts = {}) => {
  const life = Rx.lifecycleAsync(opts.until);
  port.start?.();

  // TEMP streams; will be replaced by real port-wired streams 🐷
  const tmp$ = Rx.subject<any>().asObservable();

  /**
   * API:
   */
  const repo: t.CrdtRepoWorkerShim = {
    via: 'worker' as const,

    /**
     * Properties:
     */
    get ready() {
      return true;
    },
    get id() {
      return { instance: 'worker-shim', peer: 'worker-shim' } as const;
    },
    get sync() {
      return {
        peers: [] as t.PeerId[],
        urls: [] as t.StringUrl[],
        enabled: false,
        enable() {
          /* no-op until transport lands */
        },
      };
    },
    get stores() {
      return [] as readonly t.CrdtRepoStoreInfo[];
    },

    /**
     * Methods:
     */
    async whenReady() {
      return repo as t.CrdtRepo;
    },
    create<T extends O>() {
      throw notImpl('CrdtRef.create/change');
    },
    async get<T extends O>() {
      return {
        error: { kind: 'NotFound', message: 'not implemented (worker get)' } as t.CrdtRepoError,
      };
    },
    async delete() {
      throw notImpl('repo.delete');
    },
    events(until) {
      return Rx.toLifecycle<t.CrdtRepoEvents>(Rx.lifecycle([life.dispose$, until]), {
        $: tmp$ as t.Observable<t.CrdtRepoEvent>,
        prop$: tmp$ as t.Observable<t.CrdtRepoPropChangeEvent['payload']>,
        ready$: tmp$ as t.Observable<boolean>,
        network$: tmp$ as t.Observable<t.CrdtNetworkChangeEvent>,
      });
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

  return repo;
};

/**
 * Helpers:
 */
const notImpl = (name: string) => {
  const err = new Error(`🐷 ${name} not implemented in worker client yet`);
  (err as any).kind = 'NotImplemented';
  return err;
};
