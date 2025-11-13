import { type t, Obj, Rx, Try } from './common.ts';
import { Wire } from './u.evt.wire.ts';

type O = Record<string, unknown>;

// TEMP streams (to be replaced as we wire more events across the port). 🐷
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
  const state: { ready: boolean; props?: t.CrdtRepoProps } = { ready: false };

  /** Behavior-like subject so late subscribers see last value. */
  const ready$ = Rx.behaviorSubject<boolean>(state.ready);
  const event$ = Rx.subject<t.CrdtRepoEvent>();
  const prop$ = Rx.subject<t.CrdtRepoPropChangeEvent['payload']>();
  const network$ = Rx.subject<t.CrdtNetworkChangeEvent>();

  function updateReady(next: boolean) {
    state.ready = next;
    ready$.next(next);
  }

  /**
   * Handle incoming repo stream events.
   */
  function onMessage(ev: MessageEvent) {
    const msg = ev.data as t.WireMessage | undefined;
    if (!msg || msg.type !== 'event' || msg.stream !== Wire.Stream.repo) return;
    const e = msg.event;

    // 1. Ready + snapshot (init state):
    if (e.type === 'ready' || e.type === 'props/snapshot') {
      if (e.type === 'props/snapshot') state.props = e.payload;
      const next = !!e.payload.ready;
      return void (next !== state.ready ? updateReady(next) : undefined);
    }

    // 2. Repo prop changes (mirrors state + pushes to prop$):
    if (e.type === 'props/change') {
      const before = Wire.clone(e.payload.before);
      const after = Wire.clone(e.payload.after);
      state.props = after;
      return void prop$.next({ prop: e.payload.prop, before, after });
    }

    // 3. Network events (peer online/offline/close):
    if (Wire.Is.networkEvent(e)) {
      return void network$.next(e);
    }

    // 4. Lifecycle signals at the wire layer only (ignored at repo surface):
    if (Wire.Is.streamLifecycle(e)) {
      return;
    }

    // 5. Nothing else remains
    //    All other event variants are worker-internal and should not surface.
    return;
  }

  port.addEventListener?.('message', onMessage);

  /**
   * API:
   */
  const repo: t.CrdtRepoWorkerShim = {
    via: 'worker-proxy' as const,

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
        $: event$.pipe(Rx.takeUntil(gate.dispose$)),
        prop$: prop$.pipe(Rx.takeUntil(gate.dispose$)),
        ready$: ready$.pipe(Rx.takeUntil(gate.dispose$)),
        network$: network$.pipe(Rx.takeUntil(gate.dispose$)),
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
    Try.catch(() => ready$.complete());
    Try.catch(() => event$.complete());
    Try.catch(() => prop$.complete());
    Try.catch(() => network$.complete());
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
