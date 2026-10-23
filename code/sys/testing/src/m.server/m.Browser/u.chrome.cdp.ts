import { Err, Json, type t } from './common.ts';

const DEFAULT_CONNECT_TIMEOUT = 5_000;
const DEFAULT_COMMAND_TIMEOUT = 15_000;

type Pending = {
  readonly resolve: (value: unknown) => void;
  readonly reject: (error: Error) => void;
  readonly timer: ReturnType<typeof setTimeout>;
};

/** Open one bounded Chrome DevTools Protocol WebSocket connection. */
export function connectCdp(
  url: string,
  timeout = DEFAULT_CONNECT_TIMEOUT,
): Promise<t.Browser.Chrome.Cdp.Client> {
  return new Promise<t.Browser.Chrome.Cdp.Client>((resolve, reject) => {
    const ws = new WebSocket(url);
    let settled = false;
    const finish = (kind: 'open' | 'failure', error?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      ws.removeEventListener('open', onOpen);
      ws.removeEventListener('error', onError);
      ws.removeEventListener('close', onClose);
      if (kind === 'open') resolve(createCdpClient(ws));
      else {
        try {
          ws.close();
        } catch {
          // Connection already terminal.
        }
        reject(error ?? new Error('Failed to connect to Chrome DevTools Protocol.'));
      }
    };
    const onOpen = () => finish('open');
    const onError = () => finish('failure');
    const onClose = () => {
      finish('failure', new Error('Chrome DevTools Protocol connection closed before opening.'));
    };
    const timer = setTimeout(() => {
      finish(
        'failure',
        new Error(`Timed out after ${timeout}ms connecting to Chrome DevTools Protocol.`),
      );
    }, timeout);

    ws.addEventListener('open', onOpen, { once: true });
    ws.addEventListener('error', onError, { once: true });
    ws.addEventListener('close', onClose, { once: true });
  });
}

function createCdpClient(ws: WebSocket): t.Browser.Chrome.Cdp.Client {
  let id = 0;
  let closed = false;
  const handlers = new Set<(msg: t.Browser.Chrome.Cdp.Message) => void>();
  const pending = new Map<number, Pending>();
  const waiters = new Set<{ reject: (error: Error) => void; dispose: () => void }>();

  const failAll = (error: Error) => {
    const pendingItems = Array.from(pending.values());
    pending.clear();
    pendingItems.forEach((item) => {
      clearTimeout(item.timer);
      item.reject(error);
    });
    Array.from(waiters).forEach((item) => item.reject(error));
  };

  ws.addEventListener('message', (event) => {
    const msg = Json.parse<t.Browser.Chrome.Cdp.Message>(String(event.data), {});
    if (msg.id && pending.has(msg.id)) {
      const item = pending.get(msg.id)!;
      pending.delete(msg.id);
      clearTimeout(item.timer);
      if (msg.error) item.reject(new Error(msg.error.message ?? 'CDP error'));
      else item.resolve(msg.result ?? {});
    }
    handlers.forEach((fn) => fn(msg));
  });

  ws.addEventListener('close', () => {
    if (closed) return;
    closed = true;
    failAll(new Error('Chrome DevTools Protocol connection closed.'));
  });

  ws.addEventListener('error', () => {
    failAll(new Error('Chrome DevTools Protocol connection error.'));
  });

  const api: t.Browser.Chrome.Cdp.Client = {
    send<T = Record<string, unknown>>(
      method: string,
      params: Record<string, unknown> = {},
      sessionId?: string,
      timeout = DEFAULT_COMMAND_TIMEOUT,
    ) {
      if (closed || ws.readyState !== WebSocket.OPEN) {
        return Promise.reject(new Error('Chrome DevTools Protocol connection is not open.'));
      }

      const tx = ++id;
      const payload = sessionId
        ? { id: tx, method, params, sessionId }
        : { id: tx, method, params };
      return new Promise<T>((resolve, reject) => {
        const timer = setTimeout(() => {
          if (!pending.delete(tx)) return;
          reject(new Error(`Timed out waiting for CDP command: ${method}`));
        }, timeout);
        pending.set(tx, { resolve: (value) => resolve(value as T), reject, timer });
        try {
          ws.send(Json.stringify(payload));
        } catch (cause) {
          pending.delete(tx);
          clearTimeout(timer);
          reject(Err.normalize(cause));
        }
      });
    },

    on(handler) {
      handlers.add(handler);
      return () => handlers.delete(handler);
    },

    waitFor(method, sessionId, timeout, predicate) {
      let cancel: () => void = () => undefined;
      const promise = new Promise<t.Browser.Chrome.Cdp.Message>((resolve, reject) => {
        let timer: ReturnType<typeof setTimeout> | undefined;
        let off: (() => void) | undefined;

        const waiter = {
          reject: (error: Error) => finish('reject', error),
          dispose: () => finish('dispose'),
        };

        const finish = (
          kind: 'resolve' | 'reject' | 'dispose',
          value?: t.Browser.Chrome.Cdp.Message | Error,
        ) => {
          if (!waiters.has(waiter)) return;
          waiters.delete(waiter);
          if (timer) clearTimeout(timer);
          off?.();
          if (kind === 'resolve') resolve(value as t.Browser.Chrome.Cdp.Message);
          if (kind === 'reject') reject(value as Error);
        };

        cancel = waiter.dispose;
        waiters.add(waiter);
        timer = setTimeout(() => {
          finish('reject', new Error(`Timed out waiting for CDP event: ${method}`));
        }, timeout);

        off = api.on((msg) => {
          if (msg.method !== method) return;
          if (sessionId && msg.sessionId !== sessionId) return;
          if (predicate && !predicate(msg)) return;
          finish('resolve', msg);
        });
      }) as t.Browser.Chrome.Cdp.Waiter;
      Object.defineProperty(promise, 'cancel', { value: () => cancel() });
      return promise;
    },

    close() {
      if (closed) return;
      closed = true;
      failAll(new Error('Chrome DevTools Protocol connection closed.'));
      try {
        ws.close();
      } catch {
        // Already closed.
      }
    },
  };

  return api;
}
