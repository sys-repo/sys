import { type t, Is, Rx, Try, Time } from './common.ts';
import { Wire } from './u.wire.ts';

type O = Record<string, unknown>;
type State = { ready: boolean; props?: t.CrdtRepoProps; health: t.WireRepoHealth };

const EMPTY_ID: t.Crdt.Repo['id'] = { instance: '', peer: '' };

/**
 * Factory: repo client façade over a MessagePort.
 * - Preserves the `t.CrdtRepo` surface.
 * - Mutations throw "NotImplemented" (until transport RPC lands).
 * - Lifecycle is real (dispose$/dispose) using Rx helpers.
 */
export const createRepo: t.CrdtWorkerLib['repo'] = (port: MessagePort, opts = {}) => {
  const life = Rx.lifecycleAsync(opts.until);
  const stalledAfter = opts.stalledAfter ?? 1_500;
  port.start?.();

  /**
   * Local state mirrored from wire.
   */
  const state: State = {
    ready: false,
    health: { busy: false, lastProgressAt: 0 },
  };

  /**
   * Derive a stable status shape from current state.
   */
  function computeStatus(): t.CrdtRepoStatus {
    const { ready, health } = state;
    const { busy, lastProgressAt } = health;
    const now = Date.now();
    const stalled =
      !!busy && Is.num(lastProgressAt) && lastProgressAt > 0 && now - lastProgressAt > stalledAfter;
    return { ready, busy: !!busy, stalled };
  }

  /**
   * Schedule a one-shot check at (stall threshold - elapsed).
   * If, at that time, the repo is still busy and has become stalled,
   * emit a synthetic props/change("status") event.
   */
  let stallTimer: t.Cancellable | undefined;
  function scheduleStallTimer() {
    clearStallTimer();
    const { health } = state;
    if (!health.busy || !Is.num(health.lastProgressAt) || health.lastProgressAt <= 0) return;

    const now = Time.now.timestamp;
    const elapsed = now - health.lastProgressAt;
    const remaining = stalledAfter - elapsed;
    const delay = remaining > 0 ? remaining : 0;

    function handleTimeout() {
      stallTimer = undefined;
      if (life.disposed || !state.props) return;

      const current = computeStatus();
      if (!current.busy || !current.stalled) return;

      const beforeStatus: t.CrdtRepoStatus = { ...current, stalled: false };
      const before: t.CrdtRepoProps = { ...state.props, status: beforeStatus };
      const after: t.CrdtRepoProps = { ...state.props, status: current };
      state.props = after;
      emit({
        type: 'props/change',
        payload: { prop: 'status', before, after },
      });
    }

    stallTimer = Time.delay(delay, handleTimeout);
  }
  function clearStallTimer() {
    stallTimer?.cancel();
    stallTimer = undefined;
  }

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

    if (msg.type === 'event') {
      if (msg.stream !== Wire.Kind.repo) return;
      const e = msg.event;

      /**
       * 1. Ready + snapshot (init state):
       */
      if (e.type === 'ready' || e.type === 'props/snapshot') {
        if (e.type === 'props/snapshot') {
          const snapshot = Wire.clone(e.payload);
          state.props = snapshot;

          // Seed health from snapshot.status where available.
          const status = snapshot.status;
          if (status) {
            state.health = {
              busy: status.busy,
              lastProgressAt: status.busy ? Date.now() : 0,
            };
            if (status.busy) {
              scheduleStallTimer();
            } else {
              clearStallTimer();
            }
          }
        }

        const nextReady = !!e.payload.ready;
        updateReady(nextReady);
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
        if (e.payload.prop === 'ready') {
          updateReady(!!after.ready);
        }

        emit({
          type: 'props/change',
          payload: {
            prop: e.payload.prop,
            before,
            after,
          },
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
       * 4. Health events (busy/progress diagnostics):
       *    - mirror health into local state
       *    - synthesize a props/change("status") on actual status transitions.
       *    - schedule a timer-based stall check while busy.
       */
      if (e.type === 'health') {
        const prevStatus = computeStatus();
        state.health = e.payload as t.WireRepoHealth;
        const nextStatus = computeStatus();

        // Only emit a synthetic status change if something actually changed and
        // we have a props snapshot to base the before/after on.
        if (state.props) {
          const changed =
            prevStatus.ready !== nextStatus.ready ||
            prevStatus.busy !== nextStatus.busy ||
            prevStatus.stalled !== nextStatus.stalled;

          if (changed) {
            const before: t.CrdtRepoProps = { ...state.props, status: prevStatus };
            const after: t.CrdtRepoProps = { ...state.props, status: nextStatus };
            state.props = after;
            emit({
              type: 'props/change',
              payload: { prop: 'status', before, after },
            });
          }
        }

        if (nextStatus.busy) {
          scheduleStallTimer();
        } else {
          clearStallTimer();
        }

        return;
      }

      /**
       * 5. Lifecycle signals at the wire layer only (ignored at repo surface):
       */
      if (Wire.Is.streamLifecycle(e)) {
        return;
      }

      // 6. Nothing else remains; worker-internal variants are not surfaced.
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

    // 'call' and 'cancel' are not used on the client side.
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
        enable(enabled?: boolean) {
          void rpc('sync.enable', enabled);
        },
      };
    },

    get stores() {
      return (state.props?.stores ?? []) as readonly t.CrdtRepoStoreInfo[];
    },

    /**
     * Health/status diagnostics (override).
     */
    get status() {
      return computeStatus();
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
          .subscribe({
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
    Try.run(() => port.removeEventListener?.('message', onMessage));
    Try.run(() => port.close?.());
    Try.run(() => ready$.complete());
    Try.run(() => event$.complete());
    Try.run(() => clearStallTimer());

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
