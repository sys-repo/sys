import type { NetworkAdapterInterface } from '@automerge/automerge-repo';

export type DeferMode = 'micro' | 'macro' | 'raf';
const WRAPPED = Symbol('safeNetwork:wrapped');

/** Only these Automerge adapter events can arrive mid-update and trigger re-entrancy; defer them. */
const DEFAULT_DEFER_EVENTS = new Set(['message', 'sync']);

/**
 * Convenience: wrap an array of network adapters.
 * Equivalent to mapping each through {@link wrapAdapter}.
 */
export function wrapAll(
  adapters: NetworkAdapterInterface[] = [],
  mode: DeferMode = 'macro',
  deferEvents: Set<string> = DEFAULT_DEFER_EVENTS,
) {
  return adapters.map((a) => wrapAdapter(a, mode, deferEvents));
}

/**
 * Wrap a single Automerge network adapter with a "safe scheduling" layer.
 *
 * This ensures inbound and outbound events (`message`, `sync`, etc.) are deferred
 * onto a stable task boundary (microtask, macrotask, or RAF), preventing re-entrant
 * calls into Automerge’s WASM runtime. Without this guard, network callbacks can
 * arrive while Automerge is still mid-update, leading to aliasing errors or UI stalls.
 *
 * Modes:
 *   - `'micro'` → queueMicrotask (tightest deferral, same tick).
 *   - `'macro'` → MessageChannel (default: fast, safe task boundary).
 *   - `'raf'`   → requestAnimationFrame + setTimeout (gives the browser breathing room).
 *
 * @param adapter - A network adapter instance (e.g. WebSocket).
 * @param mode - Scheduling mode for deferrals.
 * @param deferEvents - Event types to defer (default: `message`, `sync`).
 * @returns The same adapter, wrapped with scheduling safety.
 */
export function wrapAdapter(
  adapter: NetworkAdapterInterface,
  mode: DeferMode = 'macro',
  deferEvents: Set<string> = DEFAULT_DEFER_EVENTS,
): NetworkAdapterInterface {
  const a: any = adapter as any;
  if (!a || a[WRAPPED]) return adapter;
  Object.defineProperty(a, WRAPPED, { value: true, writable: false, configurable: false });

  const schedule = createScheduler(mode);
  const gate = createGate(schedule);

  // Inbound (event emitter style):
  wrapInboundEmitter(a, gate, deferEvents);
  wrapInboundListener(a, gate, deferEvents);

  // Inbound (direct receives):
  wrap(a, 'receiveMessage', (fn: Function) => (msg: unknown) => gate(() => fn(msg)));
  wrap(a, 'receiveSyncMessage', (fn: Function) => (msg: unknown) => gate(() => fn(msg)));
  wrap(a, 'onMessage', (fn: Function) => (evt: MessageEvent) => gate(() => fn(evt)));

  // Outbound: defer and be tolerant of temporarily closed sockets.
  wrap(
    a,
    'send',
    (send) => (peerId: string, msg: Uint8Array) =>
      gate(() => {
        try {
          // Best-effort readiness check (adapter internals differ; probe common fields)
          const sock =
            (a as any).socket ?? (a as any)._socket ?? (a as any).ws ?? (a as any)._ws ?? undefined;

          // 1 === WebSocket.OPEN. If we can see a readyState and it's not OPEN, drop silently.
          if (sock && typeof sock.readyState === 'number' && sock.readyState !== 1) return;

          // Call through
          return send(peerId, msg);
        } catch (err: any) {
          // Adapter throws "Websocket not ready (X)" — treat as transient and ignore.
          const msgText = String(err?.message || '');
          if (msgText.includes('Websocket not ready')) return;

          // Anything else is unexpected — surface it.
          throw err;
        }
      }),
  );

  return adapter;
}

/**
 * Helpers: Gate + scheduling
 */
function createGate(schedule: (f: () => void) => void) {
  let processing = false;
  const queue: Array<() => void> = [];

  const run = () => {
    const batch = queue.splice(0, queue.length);
    for (const task of batch) task();
    if (queue.length > 0) {
      // Spillover arrived while running; drain again on a fresh tick.
      schedule(run);
    } else {
      processing = false;
    }
  };

  return (fn: () => void) => {
    queue.push(fn);
    if (processing) return;
    processing = true;
    schedule(run);
  };
}

function createScheduler(mode: DeferMode) {
  if (mode === 'micro') return (fn: () => void) => queueMicrotask(fn);

  if (mode === 'raf') {
    let pending = false;
    const q: Array<() => void> = [];
    return (fn: () => void) => {
      q.push(fn);
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {
        setTimeout(() => {
          pending = false;
          const batch = q.splice(0, q.length);
          for (const f of batch) f();
        }, 0);
      });
    };
  }

  // Default: 'macro' via MessageChannel (fast, clean task boundary):
  const mc = new MessageChannel();
  const port = mc.port2;
  let scheduled = false;
  const q: Array<() => void> = [];

  mc.port1.onmessage = () => {
    scheduled = false;
    const batch = q.splice(0, q.length);
    for (const fn of batch) fn();
  };

  return (fn: () => void) => {
    q.push(fn);
    if (!scheduled) {
      scheduled = true;
      port.postMessage(0);
    }
  };
}

/**
 * Helpers: function wrapping.
 */
function wrap<T extends object, K extends keyof T & string, F extends T[K] & Function>(
  obj: T,
  key: K,
  make: (orig: F) => F,
) {
  const orig = (obj as any)[key];
  if (typeof orig !== 'function') return;
  (obj as any)[key] = make(orig.bind(obj));
}

/**
 * Wrap the adapter's emitter so certain event types are deferred.
 */
function wrapInboundEmitter(a: any, gate: (fn: () => void) => void, deferEvents: Set<string>) {
  wrap(a, 'emit', (emit) => {
    return (type: string, ...args: unknown[]) => {
      return deferEvents.has(type) ? gate(() => emit(type, ...args)) : emit(type, ...args);
    };
  });
}

/**
 * Wrap the adapter's listener registration so certain event handlers are deferred.
 */
function wrapInboundListener(a: any, gate: (fn: () => void) => void, deferEvents: Set<string>) {
  wrap(a, 'on', (on) => {
    return (type: string, listener: (...xs: any[]) => void) => {
      if (!deferEvents.has(type)) return on(type, listener);
      const deferred = (...xs: any[]) => gate(() => listener(...xs));
      return on(type, deferred);
    };
  });
}
