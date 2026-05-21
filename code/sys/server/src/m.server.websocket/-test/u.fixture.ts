import { Cmd, expect, Net, type t } from '../../-test.ts';

/** Shared fixtures for WebSocket server contract tests. */
export const Fixture = {
  closeSocket,
  deferred,
  detail,
  expectCmdError,
  rawUpgrade,
  waitForClose,
} as const;

/**
 * Helpers:
 */
function detail(status: t.Service.Status, label: string): string | undefined {
  return status.details?.find((item) => item.label === label)?.value;
}

function expectCmdError(
  input: unknown,
  kind: t.Cmd.Error.Kind,
  name: t.Cmd.Name,
): t.Cmd.Error.Instance {
  expect(Cmd.Is.error(input)).to.eql(true);
  const error = input as t.Cmd.Error.Instance;
  expect(error.name).to.eql(kind);
  expect(error.cmd?.name).to.eql(name);
  return error;
}

function closeSocket(ws: WebSocket) {
  if (ws.readyState === WebSocket.CLOSING || ws.readyState === WebSocket.CLOSED) return;
  ws.close();
}

function waitForClose(ws: WebSocket): Promise<CloseEvent | undefined> {
  if (ws.readyState === WebSocket.CLOSED) return Promise.resolve(undefined);
  return new Promise((resolve) => {
    ws.addEventListener('close', (event) => resolve(event as CloseEvent), { once: true });
  });
}

async function rawUpgrade(
  server: t.WebSocketServer.Started,
  path: t.StringUrlRoute,
): Promise<{ readonly status: number }> {
  const conn = await connect(server);
  try {
    const request = [
      `GET ${path} HTTP/1.1`,
      `Host: ${server.addr.hostname}:${server.port}`,
      'Connection: Upgrade',
      'Upgrade: websocket',
      `Sec-WebSocket-Key: ${webSocketKey()}`,
      'Sec-WebSocket-Version: 13',
      '',
      '',
    ].join('\r\n');

    await conn.write(new TextEncoder().encode(request));
    const text = await readResponseHead(conn);
    return { status: parseHttpStatus(text) };
  } finally {
    conn.close();
  }
}

async function connect(server: t.WebSocketServer.Started): Promise<Deno.TcpConn> {
  const res = await Net.connect(server.port, {
    hostname: server.addr.hostname,
    attempts: 5,
    delay: 10,
  });
  if (res.socket) return res.socket;
  throw new Error(`Failed to connect to WebSocket test server: ${res.error?.message}`);
}

async function readResponseHead(conn: Deno.Conn): Promise<string> {
  const decoder = new TextDecoder();
  let text = '';

  for (;;) {
    const buffer = new Uint8Array(512);
    const read = await conn.read(buffer);
    if (read === null) break;

    text += decoder.decode(buffer.subarray(0, read), { stream: true });
    if (text.includes('\r\n')) break;
  }

  return text;
}

function parseHttpStatus(response: string): number {
  const status = response.match(/^HTTP\/\d(?:\.\d)?\s+(\d{3})\b/)?.[1];
  if (!status) throw new Error(`Invalid HTTP response: ${response}`);
  return Number(status);
}

function webSocketKey(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject } as const;
}
