import { Fs } from '@sys/fs';
import { Files } from '@sys/model/files';
import { Cmd, expect, Is, type t, Time } from '../../-test.ts';
import { FilesServer } from '../mod.ts';

type ConnectOptions = {
  /** Per-command timeout in milliseconds. Use `false` for intentionally long-lived streams. */
  readonly timeout?: number | false;
};

type Connected = {
  readonly client: t.Files.Client.WebSocket;
  close(reason?: unknown): Promise<void>;
};

type WaitForOptions = {
  readonly timeout?: number;
  readonly interval?: number;
  readonly message?: string;
};

type ChangeMatch = {
  readonly path: t.Files.String.Path;
  readonly seq?: t.Files.Seq;
  readonly kind?: t.Files.Change['kind'] | readonly t.Files.Change['kind'][];
};

type Workspace = { readonly workspace: string; readonly root: string };
type WatchedRemote = {
  readonly remote: Connected;
  readonly events: t.Files.Change[];
  closeWatch(): Promise<void>;
};

/** Shared fixtures for Files server contract tests. */
export const Fixture = {
  connect,
  detail,
  direct,
  expectCmdError,
  waitFor,
  waitForChange,
  withFilesServer,
  withWatchedRemote,
  withWorkspace,
} as const;

/**
 * Helpers:
 */
async function connect(url: t.StringUrl, options: ConnectOptions = {}): Promise<Connected> {
  const client = await Files.Client.websocket(url, clientOptions(options));

  return {
    client,
    close: (reason?: unknown) => client.close(reason ?? 'test.cleanup'),
  };
}

function clientOptions(options: ConnectOptions): { readonly timeout?: number } {
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

async function waitForChange(
  events: readonly t.Files.Change[],
  match: ChangeMatch,
): Promise<t.Files.Change> {
  let found: t.Files.Change | undefined;
  await waitFor(
    () => {
      found = events.find((event) => changeMatches(event, match));
      return found !== undefined;
    },
    { message: `Timed out waiting for websocket Files.Change: ${match.path}.` },
  );
  if (!found) throw new Error(`Timed out waiting for websocket Files.Change: ${match.path}.`);
  return found;
}

function changeMatches(event: t.Files.Change, match: ChangeMatch): boolean {
  if (event.path !== match.path) return false;
  if (match.seq !== undefined && event.seq !== match.seq) return false;
  if (match.kind !== undefined) {
    const kinds = Is.array<t.Files.Change['kind']>(match.kind) ? match.kind : [match.kind];
    if (!kinds.includes(event.kind)) return false;
  }
  return true;
}

function detail(status: t.Service.Status, label: string): string | undefined {
  return status.details?.find((item) => item.label === label)?.value;
}

function direct<K extends t.Files.Cmd.Name>(
  backing: { readonly handlers: t.Files.Cmd.HandlerMap },
  name: K,
  payload: t.Files.Cmd.Payload[K],
): Promise<t.Files.Cmd.Result[K]> {
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
  return Promise.resolve(result as t.Files.Cmd.Result[K]);
}

async function withWorkspace<T>(
  prefix: string,
  fn: (workspace: Workspace) => Promise<T>,
): Promise<T> {
  const workspace = await Fs.makeTempDir({ prefix });
  try {
    const root = Fs.join(workspace.absolute, 'root');
    await Fs.ensureDir(Fs.join(root, 'docs'));
    return await fn({ workspace: workspace.absolute, root });
  } finally {
    await Fs.remove(workspace.absolute);
  }
}

async function withFilesServer<T>(
  files: t.FilesServer.Backing,
  fn: (server: t.FilesServer.WebSocket.Started) => Promise<T>,
): Promise<T> {
  const server = FilesServer.WebSocket.create({ path: '/files', files });
  try {
    return await fn(server);
  } finally {
    await server.close('test.cleanup');
  }
}

async function withWatchedRemote<T>(
  server: t.FilesServer.WebSocket.Started,
  fn: (remote: WatchedRemote) => Promise<T>,
): Promise<T> {
  const remote = await connect(server.url, { timeout: false });
  const events: t.Files.Change[] = [];
  const stream = remote.client.cmd.stream(Files.Cmd.Name.watch, { path: 'docs' });
  const done = stream.done.catch((error: unknown) => error);
  const subscription = stream.onEvent((event) => events.push(event));
  let closed = false;

  const closeWatch = async () => {
    if (closed) return;
    closed = true;
    stream.dispose();
    const error = await done;
    expectCmdError(error, 'CmdError.Cancelled', Files.Cmd.Name.watch);
  };

  try {
    return await fn({ remote, events, closeWatch });
  } finally {
    subscription.dispose();
    stream.dispose();
    await done;
    await remote.close();
  }
}

function expectCmdError(
  input: unknown,
  kind: t.Cmd.Error.Kind,
  name: t.Files.Cmd.Name,
): t.Cmd.Error.Instance {
  expect(Cmd.Is.error(input)).to.eql(true);
  const error = input as t.Cmd.Error.Instance;
  expect(error.name).to.eql(kind);
  expect(error.cmd?.name).to.eql(name);
  expect(error.cmd?.ns).to.eql(Files.Cmd.ns);
  return error;
}
