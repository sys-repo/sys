import { Rx, type t, Try } from './common.ts';

type O = Record<string, unknown>;

// TEMP streams (to be replaced as we wire more events across the port). 🐷
const __tmp$ = Rx.subject<any>().asObservable();

/**
 * Factory: repo client façade over a MessagePort.
 * - Preserves the `t.CrdtRepo` surface.
 * - Mutations throw "NotImplemented" (until transport RPC lands).
 * - Lifecycle is real (dispose$/dispose) using Rx helpers.
 */
export const createRepo: t.CrdtWorkerLib['repo'] = (port: MessagePort, opts = {}) => {
  const life = Rx.lifecycleAsync(opts.until);
  port.start?.();

  /** Local ready state mirrored from wire. */
  const state = { ready: false };

  /** Behavior-like subject so late subscribers see last value. */
  const ready$ = Rx.subject<boolean>();
  ready$.next(state.ready);

  /** Handle incoming repo stream events. */
  const onMessage = (ev: MessageEvent) => {
    const msg = ev.data as t.WireMessage | undefined;
    if (!msg || msg.type !== 'event' || msg.stream !== 'crdt:repo') return;

    const e = msg.event;

    if (e.type === 'ready') {
      const next = !!e.payload.ready;
      if (next !== state.ready) {
        state.ready = next;
        ready$.next(next);
      }
    }
  };

  port.addEventListener?.('message', onMessage);

  /**
   * API:
   */
  const repo: t.CrdtRepoWorkerShim = {
    via: 'worker' as const,

    /**
     * Properties:
     */
    get ready() {
      return state.ready;
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
      if (state.ready) return repo as t.CrdtRepo;

      await new Promise<void>((resolve) => {
        const gate = Rx.lifecycle([life.dispose$]);

        const cleanup = () => {
          try {
            (subReady as unknown as { unsubscribe?: () => void })?.unsubscribe?.();
          } catch {}
          try {
            (subGate as unknown as { unsubscribe?: () => void })?.unsubscribe?.();
          } catch {}
          gate.dispose();
        };

        const subReady = ready$.subscribe((rdy) => {
          if (rdy) {
            cleanup();
            resolve();
          }
        });

        // Resolve quietly if disposed before ready.
        const subGate = gate.dispose$.subscribe(() => {
          cleanup();
          resolve();
        });
      });

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
      const life2 = Rx.lifecycle([life.dispose$, until]);
      return Rx.toLifecycle<t.CrdtRepoEvents>(life2, {
        $: __tmp$ as t.Observable<t.CrdtRepoEvent>,
        prop$: __tmp$ as t.Observable<t.CrdtRepoPropChangeEvent['payload']>,
        ready$: ready$.asObservable(),
        network$: __tmp$ as t.Observable<t.CrdtNetworkChangeEvent>,
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

  life.dispose$.subscribe(() => {
    Try.catch(() => port.removeEventListener?.('message', onMessage));
    Try.catch(() => port.close?.());
  });

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
