import { Json, Time } from './common.ts';

export type CdpClient = {
  send<T = Record<string, unknown>>(
    method: string,
    params?: Record<string, unknown>,
    sessionId?: string,
  ): Promise<T>;
  on(handler: (msg: CdpMessage) => void): () => void;
  waitFor(method: string, sessionId: string | undefined, timeout: number): Promise<CdpMessage>;
  close(): void;
};

type CdpMessage = {
  id?: number;
  method?: string;
  params?: unknown;
  result?: unknown;
  error?: { message?: string; data?: string };
  sessionId?: string;
};

export function connectCdp(url: string) {
  return new Promise<CdpClient>((resolve, reject) => {
    const ws = new WebSocket(url);
    ws.addEventListener('open', () => resolve(createCdpClient(ws)), { once: true });
    ws.addEventListener('error', () => reject(new Error('Failed to connect to Chrome DevTools Protocol.')), {
      once: true,
    });
  });
}

export async function waitForBrowserWs(port: number, options: { timeout?: number } = {}) {
  const url = `http://127.0.0.1:${port}/json/version`;
  const timeout = options.timeout ?? 20_000;
  const started = Date.now();
  while (Date.now() - started < timeout) {
    try {
      const res = await fetch(url);
      const json = objectRecord(await res.json());
      if (typeof json.webSocketDebuggerUrl === 'string') return json.webSocketDebuggerUrl;
    } catch {
      // Still starting.
    }
    await Time.wait(50);
  }
  throw new Error('Timed out waiting for Chrome DevTools Protocol.');
}

function objectRecord(input: unknown): Record<string, unknown> {
  return typeof input === 'object' && input !== null ? input as Record<string, unknown> : {};
}

function createCdpClient(ws: WebSocket): CdpClient {
  let id = 0;
  const handlers = new Set<(msg: CdpMessage) => void>();
  const pending = new Map<number, { resolve: (value: unknown) => void; reject: (error: Error) => void }>();

  ws.addEventListener('message', (event) => {
    const msg = Json.parse<CdpMessage>(String(event.data), {});
    if (msg.id && pending.has(msg.id)) {
      const item = pending.get(msg.id)!;
      pending.delete(msg.id);
      if (msg.error) item.reject(new Error(msg.error.message ?? 'CDP error'));
      else item.resolve(msg.result ?? {});
    }
    handlers.forEach((fn) => fn(msg));
  });

  const api: CdpClient = {
    send<T = Record<string, unknown>>(method: string, params: Record<string, unknown> = {}, sessionId?: string) {
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
      return new Promise<CdpMessage>((resolve, reject) => {
        const timer = setTimeout(() => {
          off();
          reject(new Error(`Timed out waiting for CDP event: ${method}`));
        }, timeout);
        const off = api.on((msg) => {
          if (msg.method !== method) return;
          if (sessionId && msg.sessionId !== sessionId) return;
          clearTimeout(timer);
          off();
          resolve(msg);
        });
      });
    },

    close() {
      ws.close();
    },
  };

  return api;
}
