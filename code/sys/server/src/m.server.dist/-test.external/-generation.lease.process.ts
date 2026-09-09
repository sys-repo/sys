import { describe, expect, Fs, Is, it, Json, Num, type t, Time } from '../../-test.ts';
import { setup, teardown } from '../../-test/u.fixture.dist.ts';
import { Dist } from '../mod.ts';

const PACKAGE_DIR = Fs.Path.fromFileUrl(new URL('../../../', import.meta.url));
const CHILD: t.StringAbsolutePath = Fs.Path.fromFileUrl(
  new URL('./u.fixture.generation.lease.process.ts', import.meta.url),
);
const TARGET = '@sample.foo';
const MARKER = 'GENERATION_ACQUIRED ';
const PROTOCOL_LIMIT = 8_192;
const PROCESS_TIMEOUT = 15_000 as t.Msecs;

type Startup = Readonly<{
  listenerCalls: number;
  store: t.Dist.Generation.Store.Admitted;
}>;

type Child = {
  readonly process: Deno.ChildProcess;
  readonly status: Promise<Deno.CommandStatus>;
};

describe('Dist.Generation lease process', () => {
  it('holds cross-process shared ownership without starting a listener, then releases cleanly', async () => {
    const fixture = await setup();
    const root: t.StringAbsoluteDir = Fs.join(fixture.storeDir, 'process-root');
    const storeDir: t.StringAbsoluteDir = Fs.join(root, TARGET);
    let child: Child | undefined;
    let exclusive: t.FsRooted.Lease | undefined;

    try {
      await Fs.ensureDir(root);
      const prepared = await Dist.materialize(fixture.args({ storeDir }));
      expect(prepared.kind).to.eql('promoted');
      if (prepared.kind === 'failed') return;
      const requests = fixture.calls.length;

      const canonicalRoot = await Fs.realPath(root);
      const input: t.Dist.Generation.Open.Args = {
        store: { root: canonicalRoot, target: TARGET },
        manifestUrl: fixture.manifestUrl,
        integrity: fixture.integrity,
        policy: fixture.policy,
      };
      child = startChild(input);
      const startup = await readStartup(child);
      expect(startup).to.eql({
        listenerCalls: 0,
        store: {
          root: canonicalRoot,
          target: TARGET,
          dir: Fs.join(canonicalRoot, TARGET),
        },
      });
      expect(fixture.calls.length).to.eql(requests);

      const rooted = await Fs.Capability.Rooted.create({ root });
      const admission = await rooted.Target.admit([{ kind: 'directory', path: TARGET }]);
      const target = admission.targets[0];
      expect(await rooted.Lease.acquire([target], { mode: 'exclusive' })).to.eql({
        kind: 'busy',
        target,
      });

      await closeInput(child.process.stdin);
      const status = await settleStatus(child.status);
      expect(status.success).to.eql(true);
      expect(await new Response(child.process.stderr).text()).to.eql('');
      await child.process.stdout.cancel();
      child = undefined;

      const acquired = await rooted.Lease.acquire([target], { mode: 'exclusive' });
      expect(acquired.kind).to.eql('acquired');
      if (acquired.kind === 'acquired') exclusive = acquired.lease;
    } finally {
      await exclusive?.release();
      if (child) await stopChild(child);
      await teardown(fixture);
    }
  });
});

function startChild(input: t.Dist.Generation.Open.Args): Child {
  // `Process.spawn` deliberately owns null stdin. This proof needs one parent-to-child release byte
  // after observing contention, so it uses `Deno.Command` as the exact bidirectional process seam.
  const process = new Deno.Command(Deno.execPath(), {
    args: [
      'run',
      '--frozen',
      '--cached-only',
      '--no-prompt',
      '--quiet',
      '--allow-read', // Pinned verification intentionally validates the complete ancestor chain.
      `--allow-write=${input.store.root}`,
      '--allow-env=TERM,TERM_PROGRAM',
      '--deny-net',
      '--deny-run',
      '--deny-sys',
      '--deny-ffi',
      CHILD,
      Json.stringify(input),
    ],
    cwd: PACKAGE_DIR,
    clearEnv: true,
    env: { FORCE_COLOR: '0', TERM: 'dumb', TERM_PROGRAM: '' },
    stdin: 'piped',
    stdout: 'piped',
    stderr: 'piped',
  }).spawn();
  return { process, status: process.status };
}

async function readStartup(child: Child): Promise<Startup> {
  const reader = child.process.stdout.getReader();
  const decoder = new TextDecoder();
  const timeout = Time.delay(PROCESS_TIMEOUT);
  const expired = (async () => {
    await timeout;
    return { kind: 'timeout' } as const;
  })();
  let bytes = 0;
  let text = '';
  try {
    while (!text.includes('\n')) {
      const read = (async () => ({ kind: 'read', value: await reader.read() } as const))();
      const outcome = await Promise.race([read, expired]);
      if (outcome.kind === 'timeout') {
        await reader.cancel();
        throw new Error('Timed out waiting for Generation child acquisition.');
      }

      const next = outcome.value;
      if (next.done) {
        const status = await child.status;
        const stderr = await new Response(child.process.stderr).text();
        throw new Error(
          `Generation child exited before acquisition (${status.code}): ${stderr.trim()}`,
        );
      }
      bytes += next.value.byteLength;
      if (bytes > PROTOCOL_LIMIT) {
        throw new Error('Generation child startup evidence exceeded its bound.');
      }
      text += decoder.decode(next.value, { stream: true });
    }
  } finally {
    timeout.cancel();
    reader.releaseLock();
  }

  return parseStartup(text.slice(0, text.indexOf('\n')));
}

function parseStartup(line: string): Startup {
  if (!line.startsWith(MARKER)) throw new Error(`Invalid Generation child evidence: ${line}`);
  const value = Json.parse<unknown>(line.slice(MARKER.length));
  if (
    !Is.record(value) || !Num.Is.safeInt(value.listenerCalls) || !Is.record(value.store) ||
    !Is.str(value.store.root) || !Is.str(value.store.target) || !Is.str(value.store.dir)
  ) {
    throw new Error('Invalid Generation child startup JSON.');
  }
  return {
    listenerCalls: value.listenerCalls,
    store: {
      root: value.store.root,
      target: value.store.target,
      dir: value.store.dir,
    },
  };
}

async function closeInput(input: WritableStream<Uint8Array>): Promise<void> {
  const writer = input.getWriter();
  try {
    await writer.write(new Uint8Array([1]));
    await writer.close();
  } finally {
    writer.releaseLock();
  }
}

async function settleStatus(status: Promise<Deno.CommandStatus>): Promise<Deno.CommandStatus> {
  const timeout = Time.delay(PROCESS_TIMEOUT);
  try {
    const statusOutcome = async () => {
      const value = await status;
      return { kind: 'status', value } as const;
    };
    const timeoutOutcome = async () => {
      await timeout;
      return { kind: 'timeout' } as const;
    };
    const outcome = await Promise.race([statusOutcome(), timeoutOutcome()]);
    if (outcome.kind === 'status') return outcome.value;
    throw new Error('Timed out waiting for Generation child release.');
  } finally {
    timeout.cancel();
  }
}

async function stopChild(child: Child): Promise<void> {
  try {
    child.process.kill('SIGKILL');
  } catch (cause) {
    // Host termination races expose only native error classes on this direct process seam.
    if (!(cause instanceof TypeError || cause instanceof Deno.errors.NotFound)) throw cause;
  }
  await child.status;
  await ignoreFailure(() => child.process.stdin.abort());
  await ignoreFailure(() => child.process.stdout.cancel());
  await ignoreFailure(() => child.process.stderr.cancel());
}

async function ignoreFailure(operation: () => Promise<unknown>): Promise<void> {
  try {
    await operation();
  } catch {
    // Best-effort process-stream cleanup must preserve the primary test settlement.
  }
}
