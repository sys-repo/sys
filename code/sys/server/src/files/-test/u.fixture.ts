import { Cmd, expect, Net, type t } from '../../-test.ts';
import { Files } from '@sys/model/files';
import type { Files as FilesType } from '@sys/model/files/t';

/** Shared fixtures for Files server contract tests. */
export const Fixture = {
  connect,
  detail,
  direct,
  expectCmdError,
} as const;

/**
 * Helpers:
 */
async function connect(url: t.StringUrl): Promise<Connected> {
  const ws = new WebSocket(url);
  const closed = waitForClose(ws);

  await Net.waitFor(ws);
  const cmd = Cmd.make<
    FilesType.Cmd.Name,
    FilesType.Cmd.Payload,
    FilesType.Cmd.Result,
    FilesType.Cmd.Event
  >({ ns: Files.Cmd.ns });
  const client = cmd.client(Cmd.Transport.fromWebSocket(ws), { timeout: 1_000 });

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

type Connected = {
  readonly ws: WebSocket;
  readonly client: FilesType.Client;
  close(): Promise<void>;
};

function detail(status: t.Service.Status, label: string): string | undefined {
  return status.details?.find((item) => item.label === label)?.value;
}

function direct<K extends FilesType.Cmd.Name>(
  backing: { readonly handlers: FilesType.Cmd.HandlerMap },
  name: K,
  payload: FilesType.Cmd.Payload[K],
): Promise<FilesType.Cmd.Result[K]> {
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
  return Promise.resolve(result as FilesType.Cmd.Result[K]);
}

function expectCmdError(
  input: unknown,
  kind: t.Cmd.Error.Kind,
  name: FilesType.Cmd.Name,
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
