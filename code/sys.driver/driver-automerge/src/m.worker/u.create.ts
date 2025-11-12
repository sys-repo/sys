import { type t, Rx, Try } from './common.ts';
import { Wire } from './u.evt.wire.ts';

type O = Record<string, unknown>;

const __tmp$ = Rx.subject<any>().asObservable();
const EMPTY_ID: t.Crdt.Repo['id'] = { instance: '', peer: '' };

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
  const state: { ready: boolean; props?: t.WireRepoProps } = { ready: false };

  /** Behavior-like subject so late subscribers see last value. */
  const ready$ = Rx.subject<boolean>();
  ready$.next(state.ready);

  /** Handle incoming repo stream events. */
  const onMessage = (ev: MessageEvent) => {
    const msg = ev.data as t.WireMessage | undefined;
    if (!msg || msg.type !== 'event' || msg.stream !== Wire.Stream.repo) return;

    const e = msg.event;

    if (e.type === 'props/snapshot') {
      state.props = e.payload;
      const next = !!e.payload.ready;
      if (next !== state.ready) {
        state.ready = next;
        ready$.next(next);
      }
      return;
    }

    if (e.type === 'props/change') {
      state.props = e.payload.after;
      return;
    }

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
      return state.props?.id ?? { ...EMPTY_ID };
    },
    get sync() {
      return {
        peers: (state.props?.sync.peers ?? []) as t.PeerId[],
        urls: (state.props?.sync.urls ?? []) as t.StringUrl[],
        enabled: !!state.props?.sync.enabled,
        enable() {
          /* no-op until transport lands */
        },
      };
    },
    get stores() {
      return (state.props?.stores ?? []) as readonly t.CrdtRepoStoreInfo[];
    },

    /**
     * Methods:
     */
    async whenReady() {
      if (state.ready) return repo;
      await new Promise<void>((resolve) => {
        ready$
          .pipe(
            Rx.takeUntil(life.dispose$),
            Rx.filter((r) => r === true),
            Rx.take(1),
          )
          .subscribe({ next: () => resolve(), complete: () => resolve() });
      });
      return repo;
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
      const gate = Rx.lifecycle([life.dispose$, until]);
      return Rx.toLifecycle<t.CrdtRepoEvents>(gate, {
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
