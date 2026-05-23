import { Json, type t } from './common.ts';

export function connectCdp(url: string) {
  return new Promise<t.Browser.Chrome.Cdp.Client>((resolve, reject) => {
    const ws = new WebSocket(url);
    ws.addEventListener('open', () => resolve(createCdpClient(ws)), { once: true });
    ws.addEventListener('error', () => reject(new Error('Failed to connect to Chrome DevTools Protocol.')), {
      once: true,
    });
  });
}

function createCdpClient(ws: WebSocket): t.Browser.Chrome.Cdp.Client {
  let id = 0;
  let closed = false;
  const handlers = new Set<(msg: t.Browser.Chrome.Cdp.Message) => void>();
  const pending = new Map<number, { resolve: (value: unknown) => void; reject: (error: Error) => void }>();
  const waiters = new Set<{ reject: (error: Error) => void; dispose: () => void }>();

  const failAll = (error: Error) => {
    pending.forEach((item) => item.reject(error));
    pending.clear();
    Array.from(waiters).forEach((item) => item.reject(error));
    waiters.clear();
  };

  ws.addEventListener('message', (event) => {
    const msg = Json.parse<t.Browser.Chrome.Cdp.Message>(String(event.data), {});
    if (msg.id && pending.has(msg.id)) {
      const item = pending.get(msg.id)!;
      pending.delete(msg.id);
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
    send<T = Record<string, unknown>>(method: string, params: Record<string, unknown> = {}, sessionId?: string) {
      if (closed || ws.readyState !== WebSocket.OPEN) {
        return Promise.reject(new Error('Chrome DevTools Protocol connection is not open.'));
      }

      const tx = ++id;
      const payload = sessionId ? { id: tx, method, params, sessionId } : { id: tx, method, params };
      ws.send(Json.stringify(payload));
      return new Promise<T>((resolve, reject) => {
        pending.set(tx, { resolve: (value) => resolve(value as T), reject });
      });
    },

    on(handler) {
      handlers.add(handler);
      return () => handlers.delete(handler);
    },

    waitFor(method, sessionId, timeout) {
      return new Promise<t.Browser.Chrome.Cdp.Message>((resolve, reject) => {
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

        waiters.add(waiter);
        timer = setTimeout(() => {
          finish('reject', new Error(`Timed out waiting for CDP event: ${method}`));
        }, timeout);

        off = api.on((msg) => {
          if (msg.method !== method) return;
          if (sessionId && msg.sessionId !== sessionId) return;
          finish('resolve', msg);
        });
      });
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
