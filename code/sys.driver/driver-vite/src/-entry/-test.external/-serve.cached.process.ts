import { default as deno } from '../../../deno.json' with { type: 'json' };
import { Cli, describe, expect, Fs, Is, it, Path, ROOT, Time } from '../../-test.ts';

const PACKAGE_DIR = ROOT.resolve('code/sys.driver/driver-vite');
const WORKSPACE_LOCK = ROOT.resolve('deno.lock');
const CHILD = Path.join(
  PACKAGE_DIR,
  'src/-entry/-test.external/u.fixture.serve.cached.process.ts',
);
const FIXTURE_SOURCE = Path.join(PACKAGE_DIR, 'src/-entry/-test.fixture/serve');
const FIXTURE_ROOT = Path.join(PACKAGE_DIR, '.tmp/entry-serve-proof');
const DIST = Path.join(FIXTURE_ROOT, 'dist');
const HOSTNAME = '127.0.0.1';

type Startup = {
  readonly origin: string;
  readonly port: number;
};

type ChildOutcome =
  | { readonly kind: 'ready'; readonly startup: Startup }
  | { readonly kind: 'exit'; readonly status: Deno.CommandStatus }
  | { readonly kind: 'timeout' };

type StopResult = {
  readonly status: Deno.CommandStatus;
  readonly signalDelivered: boolean;
};

describe('ViteEntry cached-only serve process', () => {
  it('serves silently through public CLI dispatch without build-native authority', async () => {
    const permissions = deno.permissions as Record<string, Record<string, unknown> | undefined>;
    expect(permissions['entry-serve-proof']).to.eql({
      read: ['./.tmp/entry-serve-proof/dist'],
      net: ['127.0.0.1:0'],
      env: ['FORCE_COLOR', 'TERM', 'TERM_PROGRAM'],
    });

    try {
      await setupDist();
      await proveCachedServe();
    } finally {
      await Fs.remove(FIXTURE_ROOT, { log: false });
    }
  });

  it('settles serialized fixture copies before failed setup cleanup', async () => {
    const firstStarted = Promise.withResolvers<void>();
    const releaseFirst = Promise.withResolvers<void>();
    const failure = new Error('fixture copy sentinel');
    const targets: string[] = [];
    const copyFile: typeof Fs.copyFile = async (source, target, options) => {
      targets.push(Path.basename(target));
      if (targets.length === 1) {
        firstStarted.resolve();
        await releaseFirst.promise;
        return await Fs.copyFile(source, target, options);
      }
      throw failure;
    };

    const setup = (async () => {
      try {
        await setupDist(copyFile);
      } finally {
        await Fs.remove(FIXTURE_ROOT, { log: false });
      }
    })();

    await firstStarted.promise;
    const targetsWhileFirstPending = [...targets];
    releaseFirst.resolve();

    let setupError: unknown;
    try {
      await setup;
    } catch (cause: unknown) {
      setupError = cause;
    }

    expect(targetsWhileFirstPending).to.eql(['index.html']);
    expect(targets).to.eql(['index.html', 'dist.json']);
    expect(setupError).to.equal(failure);
    expect(await Fs.exists(FIXTURE_ROOT)).to.eql(false);
  });
});

async function proveCachedServe(): Promise<void> {
  const expected = (await Fs.read(Path.join(FIXTURE_SOURCE, 'index.html'))).data;
  if (!Is.uint8Array(expected)) throw new Error('Cached-only serve fixture is unreadable.');

  const args = [
    'run',
    '--frozen',
    `--lock=${WORKSPACE_LOCK}`,
    '--cached-only',
    '--quiet',
    '--node-modules-dir=none',
    '--no-prompt',
    '--config=deno.json',
    '-P=entry-serve-proof',
    CHILD,
    '--cmd=serve',
    `--dir=${DIST}`,
    '--port=0',
    '--silent',
  ];
  expect(args.some((value) => value.startsWith('--allow-ffi'))).to.eql(false);
  expect(args.some((value) => value.startsWith('--allow-sys'))).to.eql(false);
  expect(args.some((value) => value.startsWith('--allow-run'))).to.eql(false);
  expect(args.some((value) => value.startsWith('--allow-write'))).to.eql(false);

  const denoDir = Deno.env.get('DENO_DIR');
  const child = new Deno.Command(Deno.execPath(), {
    args,
    cwd: PACKAGE_DIR,
    clearEnv: true,
    env: {
      FORCE_COLOR: '0',
      TERM: 'dumb',
      TERM_PROGRAM: '',
      ...(denoDir ? { DENO_DIR: denoDir } : {}),
    },
    stdin: 'null',
    stdout: 'piped',
    stderr: 'piped',
  }).spawn();
  const ready = Promise.withResolvers<Startup>();
  const stdout = capture(child.stdout, (text) => settleStartup(text, ready.resolve));
  const stderr = capture(child.stderr);
  const status = child.status;
  const timeout = Time.delay(15_000);

  let settled: Deno.CommandStatus | undefined;
  try {
    const outcome: ChildOutcome = await Promise.race([
      ready.promise.then((startup) => ({ kind: 'ready', startup }) as const),
      status.then((value) => ({ kind: 'exit', status: value }) as const),
      timeout.then(() => ({ kind: 'timeout' }) as const),
    ]);

    if (outcome.kind === 'exit') {
      settled = outcome.status;
      throw earlyExit(await stdout, await stderr);
    }
    if (outcome.kind === 'timeout') {
      settled = (await stopChild(child, status, 'SIGINT')).status;
      throw startupTimeout(await stdout, await stderr);
    }

    const actual = await waitForIndex(outcome.startup.origin);
    expect(actual).to.eql(expected);
    await expectRunning(status);

    const stopped = await stopChild(child, status, 'SIGINT');
    settled = stopped.status;
    expect(stopped.signalDelivered).to.eql(true);
    expect(settled.success || settled.signal === 'SIGINT').to.eql(true);
    assertPortReleased(outcome.startup.port);
  } finally {
    timeout.cancel();
    if (!settled) settled = (await stopChild(child, status, 'SIGINT')).status;
  }

  const terminal = `${await stdout}\n${await stderr}`;
  const markers = terminal.match(/driver-vite-entry-serve-ready:[^\n]*/g) ?? [];
  expect(markers.length).to.eql(1);
  const presentation = terminal.replace(`${markers[0]}\n`, '');
  expect(Cli.stripAnsi(presentation).trim()).to.eql('');
  expect(terminal).not.to.include('NotCapable');
  expect(terminal).not.to.include('PermissionDenied');
  expect(terminal).not.to.include('dlopen');
}

async function setupDist(copyFile: typeof Fs.copyFile = Fs.copyFile): Promise<void> {
  await Fs.remove(FIXTURE_ROOT, { log: false });
  await Fs.ensureDir(DIST);
  await copyFile(
    Path.join(FIXTURE_SOURCE, 'index.html'),
    Path.join(DIST, 'index.html'),
    { throw: true },
  );
  await copyFile(
    Path.join(FIXTURE_SOURCE, 'manifest.json'),
    Path.join(DIST, 'dist.json'),
    { throw: true },
  );
}

function capture(
  stream: ReadableStream<Uint8Array>,
  onText: (text: string) => void = () => undefined,
): Promise<string> {
  return (async () => {
    const decoder = new TextDecoder();
    let text = '';
    for await (const chunk of stream) {
      text += decoder.decode(chunk, { stream: true });
      onText(text);
    }
    text += decoder.decode();
    onText(text);
    return text;
  })();
}

function settleStartup(text: string, resolve: (startup: Startup) => void): void {
  const match = text.match(/driver-vite-entry-serve-ready:(127\.0\.0\.1):(\d+)/);
  if (!match) return;

  const port = Number.parseInt(match[2], 10);
  resolve({ origin: `http://${match[1]}:${port}/`, port });
}

async function waitForIndex(origin: string): Promise<Uint8Array> {
  const response = await Time.waitFor(
    async () => {
      try {
        const response = await fetch(origin, { redirect: 'manual' });
        return response.status === 200 ? response : undefined;
      } catch {
        return undefined;
      }
    },
    { interval: 25, timeout: 5_000 },
  );
  if (!response) throw new Error('Timed out waiting for cached-only serve response.');
  return new Uint8Array(await response.arrayBuffer());
}

async function expectRunning(status: Promise<Deno.CommandStatus>): Promise<void> {
  const grace = Time.delay(100);
  try {
    const exited = await Promise.race([
      status.then(() => true),
      grace.then(() => false),
    ]);
    expect(exited).to.eql(false);
  } finally {
    grace.cancel();
  }
}

async function stopChild(
  child: Deno.ChildProcess,
  status: Promise<Deno.CommandStatus>,
  signal: Deno.Signal,
): Promise<StopResult> {
  const signalDelivered = signalChild(child, signal);
  const timeout = Time.delay(10_000);
  try {
    const outcome = await Promise.race([
      status.then((value) => ({ kind: 'exit', value }) as const),
      timeout.then(() => ({ kind: 'timeout' }) as const),
    ]);
    if (outcome.kind === 'exit') return { status: outcome.value, signalDelivered };

    signalChild(child, 'SIGKILL');
    return { status: await status, signalDelivered };
  } finally {
    timeout.cancel();
  }
}

function signalChild(child: Deno.ChildProcess, signal: Deno.Signal): boolean {
  try {
    child.kill(signal);
    return true;
  } catch (cause) {
    if (cause instanceof Deno.errors.NotFound) return false;
    if (cause instanceof TypeError && cause.message === 'Child process has already terminated') {
      return false;
    }
    throw cause;
  }
}

function assertPortReleased(port: number): void {
  const listener = Deno.listen({ hostname: HOSTNAME, port });
  listener.close();
}

function earlyExit(stdout: string, stderr: string): Error {
  const terminal = `${stdout}\n${stderr}`.trim();
  return new Error(`Cached-only serve exited before startup: ${terminal}`);
}

function startupTimeout(stdout: string, stderr: string): Error {
  const terminal = `${stdout}\n${stderr}`.trim();
  return new Error(`Timed out waiting for cached-only serve ownership: ${terminal}`);
}
