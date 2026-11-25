import { Is, Process, type t, Time } from './common.ts';

type Subscribe = t.Process.Signal.Lib['on'];
type LeafServer = Pick<
  Deno.HttpServer<Deno.NetAddr>,
  'addr' | 'shutdown' | 'finished' | typeof Symbol.asyncDispose
>;
type LeafExit = { readonly status: Deno.CommandStatus; readonly acknowledged: boolean };
type Leaf = AsyncDisposable & {
  readonly finished: Promise<LeafExit>;
  readonly terminate: () => void;
};

const LEAF_ACK = 'LEAF_CLEAN';

/** Own the fixture leaf's server and its required signal registration. */
export async function runLeaf(options: {
  on?: Subscribe;
  report?: (message: string) => void;
  serve?: () => LeafServer;
} = {}) {
  const { on = Process.Signal.on, report = console.info, serve = serveLeaf } = options;
  await using server = serve();
  using subscriptions = new DisposableStack();
  const request = Promise.withResolvers<'signal'>();
  const closed = async () => {
    await server.finished;
    return 'closed' as const;
  };

  requireSignal(subscriptions, on, 'SIGTERM', () => request.resolve('signal'));
  report(`LEAF:${Deno.pid}:${server.addr.port}`);
  if (await Promise.race([request.promise, closed()]) !== 'signal') {
    throw new Error('Fixture leaf server closed before signal-driven shutdown.');
  }
  await server.shutdown();
  await server.finished;
  report(LEAF_ACK);
}

/** Own fixture signal setup and verify the leaf's graceful shutdown before reporting CLEAN. */
export async function runOwner(mode: string | undefined, options: {
  on?: Subscribe;
  report?: (message: string) => void;
  spawn?: () => Leaf;
  delay?: number;
} = {}): Promise<number> {
  const { on = Process.Signal.on, report = console.info, spawn = spawnLeaf, delay = 9_000 } =
    options;
  using subscriptions = new DisposableStack();
  const request = Promise.withResolvers<'shutdown'>();
  let closing = false;
  const shutdown = () => {
    if (closing) Deno.exit(130); // Model Cell's second-interrupt escalation.
    closing = true;
    report('CLOSING');
    if (mode === 'leader-exit') Deno.exit(130); // Leave the descendant for the launcher to reap.
    if (mode === 'delayed') request.resolve('shutdown');
  };

  report(`OWNER:${Deno.pid}`);
  // Complete signal setup before acquiring a child that would need rollback on attachment failure.
  requireSignal(subscriptions, on, 'SIGINT', shutdown);
  requireSignal(subscriptions, on, 'SIGTERM', shutdown);
  requireSignal(subscriptions, on, 'SIGWINCH', () => report('RESIZED'));
  await using leaf = spawn();
  report(`OWNER_READY:${Deno.pid}`);

  const initial = await Promise.race([request.promise, leaf.finished]);
  if (initial !== 'shutdown') throw unexpectedExit(initial.status);

  const grace = Time.delay(delay);
  const elapsed = async () => {
    await grace;
    return 'elapsed' as const;
  };
  try {
    const result = await Promise.race([elapsed(), leaf.finished]);
    if (result !== 'elapsed') throw unexpectedExit(result.status);
  } finally {
    grace.cancel();
  }

  leaf.terminate();
  const { status, acknowledged } = await leaf.finished;
  if (!status.success) throw unexpectedExit(status);
  if (!acknowledged) throw new Error('Fixture leaf exited without acknowledging server shutdown.');
  report('CLEAN');
  return 130;
}

/**
 * Helpers:
 */
function requireSignal(
  subscriptions: DisposableStack,
  on: Subscribe,
  name: t.Process.Signal.Name,
  handler: () => void,
) {
  const registration = on(name, handler);
  if (registration.kind === 'unsupported') throw new Error(`Fixture requires ${name}.`);
  subscriptions.defer(registration.dispose);
}

function serveLeaf() {
  const config = { hostname: '127.0.0.1', port: 0, onListen: () => undefined };
  return Deno.serve(config, () => new Response('owned'));
}

function spawnLeaf(): Leaf {
  const child = new Deno.Command(Deno.execPath(), {
    args: ['run', '-P=test', import.meta.filename!, 'leaf'],
    stdin: 'null',
    stdout: 'piped',
    stderr: 'inherit',
  }).spawn();
  let exited = false;
  const readStatus = async () => {
    const status = await child.status;
    exited = true;
    return status;
  };
  const output = watchLeafOutput(child.stdout);
  const finished = Promise.all([readStatus(), output.acknowledged]).then(
    ([status, acknowledged]) => ({ status, acknowledged }),
  );
  return {
    finished,
    terminate() {
      output.markShutdownRequested();
      child.kill('SIGTERM');
    },
    async [Symbol.asyncDispose]() {
      if (!exited) {
        try {
          child.kill('SIGKILL');
        } catch (cause) {
          if (!Is.error(cause) || cause.name !== 'NotFound') throw cause;
        }
      }
      // Drain owned work; the caller already observes failures from `finished`.
      await Promise.allSettled([child.status, finished]);
    },
  };
}

/** Relay the owned leaf's stdout and check for a complete ACK first observed after the request. */
export function watchLeafOutput(
  stdout: ReadableStream<Uint8Array<ArrayBuffer>>,
  write = Process.stdout.write,
) {
  let output = '';
  let requestedAt: number | undefined;
  const acknowledged = (async () => {
    // The owned leaf writes only readiness and shutdown acknowledgement to this pipe.
    for await (const text of stdout.pipeThrough(new TextDecoderStream())) {
      output += text;
      write(text);
    }
    const ack = new RegExp(`(^|\\n)${LEAF_ACK}\\r?\\n`).exec(output);
    return requestedAt !== undefined && ack !== null && ack.index + ack[1].length >= requestedAt;
  })();
  return {
    acknowledged,
    markShutdownRequested() {
      requestedAt ??= output.length;
    },
  };
}

function unexpectedExit(status: Deno.CommandStatus) {
  return new Error(`Unexpected fixture leaf exit: code=${status.code}, signal=${status.signal}.`);
}

if (import.meta.main) {
  const [mode] = Deno.args;
  if (mode === 'leaf') await runLeaf();
  else Deno.exitCode = await runOwner(mode);
}
