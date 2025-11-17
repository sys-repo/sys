import { type t, Is, Rx, Try } from './common.ts';
import { createStallDetector } from './u.stall.ts';
import { Wire } from './u.wire.ts';

type O = Record<string, unknown>;
type State = { ready: boolean; props?: t.CrdtRepoProps };

const EMPTY_ID: t.Crdt.Repo['id'] = { instance: '', peer: '' };

/**
 * Factory: repo client façade over a MessagePort.
 */
export const createRepo: t.CrdtWorkerLib['repo'] = (port: MessagePort, opts = {}) => {
  const life = Rx.lifecycleAsync(opts.until);
  port.start?.();

  /**
   * Local state mirrored from wire.
   */
  const state: State = {
    ready: false,
  };

  /**
   * Status is mirrored from the latest repo props.
   * If no props have been seen yet, we report a benign default.
   */
  function computeStatus(): t.CrdtRepoStatus {
    if (!state.props) return { ready: state.ready, stalled: false };
    return { ...state.props.status };
  }

  /** Canonical repo event stream (props/change + network). */
  const event$ = Rx.subject<t.CrdtRepoEvent>();
  const emit = (e: t.CrdtRepoEvent) => event$.next(e);

  function updateReady(next: boolean) {
    if (next === state.ready) return;
    const before = Wire.clone(repo);
    state.ready = next;
    emit({
      type: 'props/change',
      payload: { prop: 'status', before, after: Wire.clone(repo) },
    });
  }

  const stallDetector = createStallDetector({
    until: life.dispose$,
    stallAfter: opts.stalledAfter ?? 2_000,
    onStalledChange(stalled) {
      if (!state.props) return; // If we don’t yet have props, there’s nothing meaningful to emit.
      const before = Wire.clone(state.props);
      const after: t.CrdtRepoProps = { ...state.props, status: { ...state.props.status, stalled } };
      state.props = after;
      emit({ type: 'props/change', payload: { prop: 'status', before, after } });
    },
  });

  /**
   * RPC call tracking for client → worker method calls.
   */
  type RpcPendingEntry<M extends t.WireRepoMethod = t.WireRepoMethod> = {
    readonly resolve: (value: t.WireRepoResultData[M]) => void;
    readonly reject: (error: unknown) => void;
  };

  let nextId: t.WireId = 1;
  const pending = new Map<t.WireId, RpcPendingEntry>();

  function rpc<M extends t.WireRepoMethod>(
    method: M,
    ...args: t.WireRepoArgs[M]
  ): Promise<t.WireRepoResultData[M]> {
    const id: t.WireId = nextId++;
    const msg = Wire.call(id, method, ...args);

    return new Promise<t.WireRepoResultData[M]>((resolve, reject) => {
      pending.set(id, {
        resolve: (value) => resolve(value as t.WireRepoResultData[M]),
        reject,
      });
      Try.run(() => port.postMessage(msg)).catch((err) => {
        pending.delete(id);
        reject(err);
      });
    });
  }

  /**
   * Handle incoming repo stream events.
   */
  function onMessage(ev: MessageEvent) {
    const msg = ev.data as t.WireMessage | undefined;
    if (!msg) return;

    stallDetector.touch();

    if (msg.type === 'event') {
      if (msg.stream !== Wire.Kind.repo) return;
      const e = msg.event;

      /**
       * 1. Ready + snapshot (initial state):
       */
      if (e.type === 'props/snapshot') {
        const snapshot = Wire.clone(e.payload);
        state.props = snapshot;
        updateReady(e.payload.status.ready);
        return;
      }

      /**
       * 2. Repo prop changes (mirror state + emit normalized props/change event):
       */
      if (e.type === 'props/change') {
        const before = Wire.clone(e.payload.before);
        const after = Wire.clone(e.payload.after);
        state.props = after;

        // Keep ready latch in sync if "ready" moved via props/change.
        if (e.payload.prop === 'status') updateReady(!!after.status.ready);
        emit({
          type: 'props/change',
          payload: { prop: 'status', before, after },
        });

        return;
      }

      /**
       * 3. Network events (peer online/offline/close):
       */
      if (Wire.Is.networkEvent(e)) {
        emit(e as t.CrdtNetworkChangeEvent);
        return;
      }

      /**
       * 4. Lifecycle signals at the wire layer only (ignored at repo surface):
       */
      if (Wire.Is.streamLifecycle(e)) {
        return;
      }

      // Nothing else remains; worker-internal variants not surfaced.
      return;
    }

    if (msg.type === 'result') {
      const { id } = msg;
      const entry = pending.get(id);
      if (!entry) return;

      pending.delete(id);

      if (msg.ok) {
        entry.resolve(msg.data as t.WireRepoResultData[t.WireRepoMethod]);
      } else {
        // Worker already wrapped the error as a WireError; surface as-is.
        entry.reject(msg.error);
      }

      return;
    }
  }

  port.addEventListener?.('message', onMessage);

  /**
   * API:
   */
  const repo: t.CrdtRepoWorkerProxy = {
    via: 'worker-proxy' as const,

    /**
     * Properties:
     */
    get id() {
      return state.props?.id ?? { ...EMPTY_ID };
    },

    get status() {
      return computeStatus();
    },

    get sync(): t.CrdtRepo['sync'] {
      const sync = state.props?.sync;
      return {
        peers: (sync?.peers ?? []) as t.PeerId[],
        urls: (sync?.urls ?? []) as t.StringUrl[],
        enabled: sync?.enabled ?? null,
        enable(enabled?: boolean) {
          void rpc('sync.enable', enabled);
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
        const ev = repo.events();
        ev.ready$.pipe(Rx.take(1)).subscribe({
          next: () => resolve(),
          complete: () => resolve(),
        });
      });

      return repo;
    },

    create<T extends O>(_initial: T | (() => T)): t.CrdtRef<T> {
      throw notImpl('CrdtRef.create/change');
    },

    async get<T extends O>(
      id: t.StringId,
      options?: t.CrdtRepoGetOptions,
    ): Promise<t.CrdtRefGetResponse<T>> {
      return (await rpc('get', id, options)) as t.CrdtRefGetResponse<T>;
    },

    async delete(input: t.StringId | t.Crdt.Ref) {
      const docId: t.StringId = Is.string(input) ? input : input.id;
      await rpc('delete', docId);
    },

    events(until) {
      const gate = Rx.lifecycle([life.dispose$, until]);
      const $ = event$.pipe(Rx.takeUntil(gate.dispose$));

      return Rx.toLifecycle<t.CrdtRepoEvents>(gate, {
        $,
        ready$: $.pipe(
          Rx.filter((e) => e.type === 'props/change'),
          Rx.filter((e) => e.payload.prop === 'status'),
          Rx.map((e) => e.payload.after.status.ready),
          Rx.distinctWhile((prev, next) => prev === next),
        ),
        prop$: $.pipe(
          Rx.filter((e) => e.type === 'props/change'),
          Rx.map((e) => e.payload),
        ),
        network$: $.pipe(Rx.filter((e) => Wire.Is.networkEvent(e))),
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
    Try.run(() => port.removeEventListener?.('message', onMessage));
    Try.run(() => port.close?.());
    Try.run(() => event$.complete());

    const err = new Error('Crdt worker repo disposed');
    pending.forEach((entry) => entry.reject(err));
    pending.clear();
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
