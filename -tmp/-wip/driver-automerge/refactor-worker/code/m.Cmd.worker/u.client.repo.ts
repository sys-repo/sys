import { type t, Is, Rx, Try, toWorkerError } from './common.ts';
import { createDocProxy } from '../m.worker/u.client.proxy.doc.ts';
import { Wire } from '../m.worker/u.wire.ts';
import { createStallDetector } from './u.client.stall.ts';
import { make } from './u.make.ts';

type O = Record<string, unknown>;
type State = { ready: boolean; props?: t.CrdtRepoProps };

const EMPTY_ID: t.Crdt.Repo['id'] = { instance: '', peer: '' };
const PORT = new WeakMap<t.CrdtRepoWorkerProxy, MessagePort>();

/**
 * Factory: repo client façade over a MessagePort using Cmd-based RPC.
 */
export const createRepo: t.CrdtWorkerCmdClientLib['repo'] = (port: MessagePort, opts = {}) => {
  const life = Rx.lifecycleAsync(opts.until);
  port.start?.();

  /**
   * Cmd client for RPC operations.
   */
  const cmd = make();
  const client = cmd.client(port);

  /**
   * Local state mirrored from wire events.
   */
  const state: State = {
    ready: false,
  };

  /**
   * Status is mirrored from the latest repo props.
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
      if (!state.props) return;
      const before = Wire.clone(state.props);
      const after: t.CrdtRepoProps = { ...state.props, status: { ...state.props.status, stalled } };
      state.props = after;
      emit({ type: 'props/change', payload: { prop: 'status', before, after } });
    },
  });

  /**
   * Handle incoming wire events (high-frequency, direct postMessage).
   */
  function onMessage(ev: MessageEvent) {
    const msg = ev.data as t.WireMessage | undefined;
    if (!msg) return;

    stallDetector.touch();

    if (msg.type === 'event') {
      if (msg.stream !== Wire.Kind.repo) return;
      const e = msg.event;

      /**
       * Ready + snapshot (initial state):
       */
      if (e.type === 'props/snapshot') {
        const snapshot = Wire.clone(e.payload);
        state.props = snapshot;
        updateReady(e.payload.status.ready);
        return;
      }

      /**
       * Repo prop changes (mirror state + emit normalized props/change event):
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
       * Network events (peer online/offline/close):
       */
      if (Wire.Is.networkEvent(e)) {
        emit(e as t.CrdtNetworkChangeEvent);
        return;
      }

      /**
       * Lifecycle signals at the wire layer only (ignored at repo surface):
       */
      if (Wire.Is.streamLifecycle(e)) {
        if (e.type === 'stream/close') {
          repo.dispose('worker:repo:stream/close');
        }
        return;
      }

      return;
    }
  }

  /**
   * API:
   */
  const repo: t.CrdtRepoWorkerProxy = {
    /**
     * Properties:
     */
    via: 'worker-proxy',
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
          void client.send('repo:sync.enable', { enabled }).catch(() => {});
        },
      };
    },
    get stores() {
      return state.props?.stores ?? [];
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

    async create<T extends O>(_initial: T | (() => T)) {
      try {
        const initial = Is.func(_initial) ? _initial() : _initial;
        const result = await client.send('repo:create', { initial });
        const id = result.id;

        if (!id) {
          const err = 'Crdt.WorkerCmd.repo.create: worker returned no id';
          return { ok: false, error: toWorkerError(err) };
        }

        // Reuse the existing get-path to build the worker-proxy ref and attach doc.
        return await repo.get<T>(id);
      } catch (err: any) {
        return { ok: false, error: toWorkerError(err.message) };
      }
    },

    async get<T extends O>(
      id: t.StringId,
      options?: t.CrdtRepoGetOptions,
    ): Promise<t.CrdtRefResult<T>> {
      // Create the proxy ref *before* we ask the worker to attach the real doc.
      const doc = createDocProxy<T>(id, port, life.dispose$);

      try {
        const result = await client.send('repo:get', { id, options });

        if (result.error) {
          doc.dispose();
          return { ok: false, error: result.error };
        }

        if (!result.doc) {
          doc.dispose();
          const err = `No document for id "${id}" in repo`;
          return { ok: false, error: toWorkerError(err) };
        }

        // Sanity: defensive check that worker responded with the correct id.
        if (result.doc.id !== id) {
          doc.dispose();
          const wireId = result.doc.id;
          const err = `Crdt.WorkerCmd.repo.get("${id}") returned doc "${wireId}" (expected "${id}")`;
          const error = toWorkerError(err);
          return { ok: false, error };
        }

        return { ok: true, doc };
      } catch (err: any) {
        doc.dispose();
        return { ok: false, error: toWorkerError(err.message) };
      }
    },

    async delete(input: t.StringId | t.Crdt.Ref) {
      const docId: t.StringId = Is.string(input) ? input : input.id;
      await client.send('repo:delete', { id: docId });
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
    Try.run(() => client.dispose());
  });

  port.addEventListener?.('message', onMessage);
  PORT.set(repo, port);
  return repo;
};

/**
 * Internal helper — retrieve the MessagePort for a given worker-proxy repo.
 * Throws if not a proxy or if no port exists.
 */
export function getRepoPort(repo: t.CrdtRepoWorkerProxy): MessagePort {
  const port = PORT.get(repo);
  if (!port) throw new Error(`No MessagePort associated with repo-proxy "${repo.id}"`);
  return port;
}
