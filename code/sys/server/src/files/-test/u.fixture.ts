import { Cmd, expect, Net, type t, Time } from '../../-test.ts';
import { Files } from '@sys/model/files';
import type { Files as FilesType, FilesCmd } from '@sys/model/files/t';

/** Shared fixtures for Files server contract tests. */
export const Fixture = {
  connect,
  detail,
  direct,
  expectCmdError,
  waitFor,
} as const;

/**
 * Helpers:
 */
async function connect(url: t.StringUrl, options: ConnectOptions = {}): Promise<Connected> {
  const ws = new WebSocket(url);
  const closed = waitForClose(ws);

  await Net.waitFor(ws);
  const cmd = Cmd.make<
    FilesCmd.Name,
    FilesCmd.Payload,
    FilesCmd.Result,
    FilesCmd.Event
  >({ ns: Files.Cmd.ns });
  const client = cmd.client(Cmd.Transport.fromWebSocket(ws), clientOptions(options));

  return {
    ws,
    client,
    async close() {
      client.dispose();
      closeSocket(ws);
      await closed;
    },
  };
}

type ConnectOptions = {
  /** Per-command timeout in milliseconds. Use `false` for intentionally long-lived streams. */
  readonly timeout?: number | false;
};

type Connected = {
  readonly ws: WebSocket;
  readonly client: FilesType.Client;
  close(): Promise<void>;
};

type WaitForOptions = {
  readonly timeout?: number;
  readonly interval?: number;
  readonly message?: string;
};

function clientOptions(options: ConnectOptions): t.Cmd.Client.Options {
  if (options.timeout === false) return {};
  return { timeout: options.timeout ?? 1_000 };
}

async function waitFor(fn: () => boolean, options: WaitForOptions = {}): Promise<void> {
  const timeout = options.timeout ?? 1_200;
  const interval = options.interval ?? 20;
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeout) {
    if (fn()) return;
    await Time.wait(interval);
  }

  throw new Error(options.message ?? `Timed out waiting for Files server test condition.`);
}

function detail(status: t.Service.Status, label: string): string | undefined {
  return status.details?.find((item) => item.label === label)?.value;
}

function direct<K extends FilesCmd.Name>(
  backing: { readonly handlers: FilesCmd.HandlerMap },
  name: K,
  payload: FilesCmd.Payload[K],
): Promise<FilesCmd.Result[K]> {
  const controller = new AbortController();
  const context = {
    id: 'req-direct' as t.Cmd.ReqId,
    name,
    ns: Files.Cmd.ns,
    signal: controller.signal,
    emit() {
      throw new Error('Unexpected Files direct event');
    },
  };
  const result = backing.handlers[name](payload, context as never);
  return Promise.resolve(result as FilesCmd.Result[K]);
}

function expectCmdError(
  input: unknown,
  kind: t.Cmd.Error.Kind,
  name: FilesCmd.Name,
): t.Cmd.Error.Instance {
  expect(Cmd.Is.error(input)).to.eql(true);
  const error = input as t.Cmd.Error.Instance;
  expect(error.name).to.eql(kind);
  expect(error.cmd?.name).to.eql(name);
  expect(error.cmd?.ns).to.eql(Files.Cmd.ns);
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
