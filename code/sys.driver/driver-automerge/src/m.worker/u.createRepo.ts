import { type t, Rx, Try } from './common.ts';
import { Wire } from './u.wire.ts';

type O = Record<string, unknown>;
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

  /** Canonical repo event stream (props/change + network). */
  const event$ = Rx.subject<t.CrdtRepoEvent>();
  const emit = (e: t.CrdtRepoEvent) => event$.next(e);

  /** Ready-state latch so late subscribers see the last value. */
  const ready$ = Rx.behaviorSubject<boolean>(state.ready);
  ready$.subscribe((next) => (state.ready = next));
  function updateReady(next: boolean) {
    if (next !== state.ready) ready$.next(next);
  }

  /**
   * Handle incoming repo stream events.
   */
  function onMessage(ev: MessageEvent) {
    const msg = ev.data as t.WireMessage | undefined;
    if (!msg || msg.type !== 'event' || msg.stream !== Wire.Kind.repo) return;
    const e = msg.event;

    // 1. Ready + snapshot (init state):
    if (e.type === 'ready' || e.type === 'props/snapshot') {
      if (e.type === 'props/snapshot') {
        state.props = e.payload;
      }
      const next = !!e.payload.ready;
      updateReady(next);
      return;
    }

    // 2. Repo prop changes (mirror state + emit normalized props/change event):
    if (e.type === 'props/change') {
      const before = Wire.clone(e.payload.before);
      const after = Wire.clone(e.payload.after);
      state.props = after;

      // Keep ready latch in sync if "ready" moved via props/change.
      if (e.payload.prop === 'ready') {
        updateReady(!!after.ready);
      }

      emit({
        type: 'props/change',
        payload: { prop: e.payload.prop, before, after },
      });
      return;
    }

    // 3. Network events (peer online/offline/close):
    if (Wire.Is.networkEvent(e)) {
      emit(e as t.CrdtNetworkChangeEvent);
      return;
    }

    // 4. Lifecycle signals at the wire layer only (ignored at repo surface):
    if (Wire.Is.streamLifecycle(e)) {
      return;
    }

    // 5. Nothing else remains; worker-internal variants are not surfaced.
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
    get sync(): t.CrdtRepo['sync'] {
      const sync = state.props?.sync;
      return {
        peers: (sync?.peers ?? []) as t.PeerId[],
        urls: (sync?.urls ?? []) as t.StringUrl[],
        enabled: sync?.enabled ?? null,
        enable() {
          /* no-op until transport lands */
          return;
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
            Rx.filter((ready) => ready === true),
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
      const $ = event$.pipe(Rx.takeUntil(gate.dispose$));
      return Rx.toLifecycle<t.CrdtRepoEvents>(gate, {
        $,
        ready$: ready$.pipe(Rx.takeUntil(gate.dispose$)),
        network$: $.pipe(Rx.filter((e) => Wire.Is.networkEvent(e))),
        prop$: $.pipe(
          Rx.filter((e) => e.type === 'props/change'),
          Rx.map((e) => e.payload),
        ),
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
