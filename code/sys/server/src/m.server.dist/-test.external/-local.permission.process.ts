import { describe, expect, Fs, Is, it, Json, Num, type t, Time } from '../../-test.ts';
import { setup, teardown } from '../../-test/u.fixture.dist.ts';

const CHILD = Fs.Path.fromFileUrl(
  new URL('./u.fixture.local.permission.process.ts', import.meta.url),
);
const HOSTNAME = '127.0.0.1';

type Startup = Readonly<{
  origin: t.StringUrl;
  port: t.PortNumber;
  ancestorDenied: true;
}>;

type ChildOutcome =
  | Readonly<{ kind: 'ready'; startup: Startup }>
  | Readonly<{ kind: 'exit'; status: Deno.CommandStatus }>
  | Readonly<{ kind: 'timeout' }>;

describe('DistServer.Local root-only process authority', () => {
  it('serves exact Local bytes without ancestor read authority', async () => {
    const fixture = await setup();
    const args = [
      'run',
      '--frozen',
      '--cached-only',
      '--no-prompt',
      `--allow-read=${fixture.source}`,
      '--allow-net=127.0.0.1:0',
      '--allow-env=FORCE_COLOR,TERM,TERM_PROGRAM',
      CHILD,
      fixture.source,
    ];
    expect(args.filter((value) => value.startsWith('--allow-'))).to.eql([
      `--allow-read=${fixture.source}`,
      '--allow-net=127.0.0.1:0',
      '--allow-env=FORCE_COLOR,TERM,TERM_PROGRAM',
    ]);

    const child = new Deno.Command(Deno.execPath(), {
      args,
      cwd: Fs.cwd(),
      clearEnv: true,
      env: { FORCE_COLOR: '0', TERM: 'dumb', TERM_PROGRAM: '' },
      stdin: 'piped',
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
        settled = await stopChild(child, status);
        throw startupTimeout(await stdout, await stderr);
      }

      expect(outcome.startup.ancestorDenied).to.eql(true);
      const manifest = await fetch(new URL('/dist.json', outcome.startup.origin));
      expect(manifest.status).to.eql(200);
      expect(new Uint8Array(await manifest.arrayBuffer())).to.eql(fixture.manifestBytes);

      const index = await fetch(outcome.startup.origin);
      expect(index.status).to.eql(200);
      expect(await index.text()).to.eql('<h1>verified</h1>');

      const asset = await fetch(new URL('/assets/app.js', outcome.startup.origin));
      expect(asset.status).to.eql(200);
      expect(new Uint8Array(await asset.arrayBuffer())).to.eql(
        fixture.assets.get('/assets/app.js'),
      );

      await closeInput(child.stdin);
      settled = await settleStatus(status);
      expect(settled.success).to.eql(true);
      assertPortReleased(outcome.startup.port);
    } finally {
      timeout.cancel();
      if (!settled) settled = await stopChild(child, status);
      await teardown(fixture);
    }

    expect(await stderr).to.eql('');
  });
});

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
  const lines = text.split('\n');
  lines.pop(); // Only parse complete protocol lines.
  for (const line of lines) {
    const marker = 'LOCAL_DIST_PROOF ';
    if (!line.startsWith(marker)) continue;
    const value = Json.parse<Partial<Startup>>(line.slice(marker.length));
    if (!value || !Is.string(value.origin) || !Num.Is.safeInt(value.port)) continue;
    if (value.port < 1 || value.port > 65_535 || value.ancestorDenied !== true) continue;
    resolve({
      origin: value.origin as t.StringUrl,
      port: value.port as t.PortNumber,
      ancestorDenied: true,
    });
  }
}

async function closeInput(input: WritableStream<Uint8Array>): Promise<void> {
  const writer = input.getWriter();
  try {
    await writer.close();
  } finally {
    writer.releaseLock();
  }
}

async function settleStatus(status: Promise<Deno.CommandStatus>): Promise<Deno.CommandStatus> {
  const timeout = Time.delay(10_000);
  try {
    const outcome = await Promise.race([
      status.then((value) => ({ kind: 'exit', value }) as const),
      timeout.then(() => ({ kind: 'timeout' }) as const),
    ]);
    if (outcome.kind === 'exit') return outcome.value;
    throw new Error('Timed out waiting for Local host shutdown.');
  } finally {
    timeout.cancel();
  }
}

async function stopChild(
  child: Deno.ChildProcess,
  status: Promise<Deno.CommandStatus>,
): Promise<Deno.CommandStatus> {
  try {
    child.kill('SIGKILL');
  } catch (cause) {
    if (cause instanceof Deno.errors.NotFound) return await status;
    if (!(cause instanceof TypeError && cause.message === 'Child process has already terminated')) {
      throw cause;
    }
  }
  return await status;
}

function assertPortReleased(port: t.PortNumber): void {
  const listener = Deno.listen({ hostname: HOSTNAME, port });
  listener.close();
}

function earlyExit(stdout: string, stderr: string): Error {
  return new Error(`Local host exited before startup: ${`${stdout}\n${stderr}`.trim()}`);
}

function startupTimeout(stdout: string, stderr: string): Error {
  return new Error(`Timed out waiting for Local host ownership: ${`${stdout}\n${stderr}`.trim()}`);
}
