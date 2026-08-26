import { Time } from '@sys/std/time';

import { describe, expect, it } from '../../src/-test.ts';
import { Cli, Err, Fs, Hash, Process, Str, type t } from '../common.ts';
import { resetGuiReleaseStores } from '../task.start.gui.reset.ts';

const PACKAGE_ROOT: t.StringAbsoluteDir = Fs.resolve(import.meta.dirname ?? '.', '../..');
const TEST_TMP_ROOT: t.StringAbsoluteDir = Fs.join(PACKAGE_ROOT, '.tmp');
const LEASE_HOLDER: t.StringAbsolutePath = Fs.Path.fromFileUrl(
  new URL('./-task.start.gui.reset.lease.process.ts', import.meta.url),
);
const EXPECTED_ROOT = '.pi/@sys/dist' as const;
const CURRENT = Object.freeze({
  target: '@sys.driver-pi' as const,
  path: '.pi/@sys/dist/@sys.driver-pi' as const,
});
const LEGACY = Object.freeze({
  target: '@sys/driver-pi' as const,
  path: '.pi/@sys/dist/@sys/driver-pi' as const,
});
const PROCESS_TIMEOUT = 2_000;
const READINESS_LIMIT = 64;

type Readiness = 'normal' | 'fragmented' | 'silent';
type LeaseHolder = Readonly<{
  process: Deno.ChildProcess;
  status: Promise<Deno.CommandStatus>;
  stdout: ReadableStreamDefaultReader<Uint8Array>;
}>;
type TreeEntrySnapshot = Readonly<{
  path: string;
  kind: 'directory' | 'file';
  dev: number | null;
  ino: number | null;
  mode: number | null;
  hash?: t.StringHash;
}>;
type TreeSnapshot = Readonly<{
  path: string;
  entries: readonly TreeEntrySnapshot[];
}>;

describe('driver-pi/scripts/task.start.gui.reset process ownership', () => {
  it('bounds readiness and preserves both stores under either shared holder', async () => {
    await Fs.ensureDir(TEST_TMP_ROOT);
    const workspace = (await Fs.makeTempDir({
      dir: TEST_TMP_ROOT,
      prefix: 'driver-pi.reset.process.',
    })).absolute;
    const root: t.StringAbsoluteDir = Fs.join(workspace, EXPECTED_ROOT);
    const current = Fs.join(workspace, CURRENT.path);
    const legacy = Fs.join(workspace, LEGACY.path);
    let holder: LeaseHolder | undefined;

    try {
      await Fs.ensureDir(Fs.join(current, 'mixed/nested'));
      await Fs.ensureDir(Fs.join(legacy, 'mixed/nested'));
      await Deno.writeTextFile(Fs.join(current, 'mixed/nested/value.txt'), 'contended-current');
      await Deno.writeTextFile(Fs.join(current, 'dist.json'), '{"store":"current"}');
      await Deno.writeTextFile(Fs.join(legacy, 'mixed/nested/value.txt'), 'contended-legacy');
      await Deno.writeTextFile(Fs.join(legacy, 'dist.json'), '{"store":"legacy"}');
      const rooted = await Fs.Capability.Rooted.create({ root, create: false });
      const admission = await rooted.admit([
        { kind: 'directory', path: CURRENT.target },
        { kind: 'directory', path: LEGACY.target },
      ]);
      for (const target of admission.targets) {
        expect((await rooted.sealTree(target)).kind).to.eql('applied');
      }

      const initial = await storeSnapshots(workspace);
      const silent = await rejectionOf(() =>
        startLeaseHolder(workspace, CURRENT.target, 'silent', 150)
      );
      expect(silent.message).to.eql('Timed out waiting for reset lease-holder readiness.');
      expect(await storeSnapshots(workspace)).to.eql(initial);

      for (
        const scenario of [
          Object.freeze({ descriptor: CURRENT, readiness: 'fragmented' as const }),
          Object.freeze({ descriptor: LEGACY, readiness: 'normal' as const }),
        ]
      ) {
        holder = await startLeaseHolder(
          workspace,
          scenario.descriptor.target,
          scenario.readiness,
        );
        const before = await storeSnapshots(workspace);
        const error = await within(
          rejectionOf(() => resetGuiReleaseStores(workspace)),
          'contended reset refusal',
        );

        expect(error.message).to.eql(
          `GUI Dist reset refused ${scenario.descriptor.path}: another owner holds this store; finish or stop that owning operation, then retry.`,
        );
        expect(await storeSnapshots(workspace)).to.eql(before);
        await expectHolderPending(holder);

        const released = await within(
          releaseLeaseHolder(holder),
          'explicit lease-holder release',
        );
        holder = undefined;
        expect(released.status.success).to.eql(true);
        expect(Cli.stripAnsi(released.stderr)).not.to.contain('error:');
        expect(await storeSnapshots(workspace)).to.eql(before);
      }

      expect(
        await within(resetGuiReleaseStores(workspace), 'final reset settlement'),
      ).to.eql([
        { path: CURRENT.path, kind: 'removed' },
        { path: LEGACY.path, kind: 'removed' },
      ]);
      expect(await Fs.exists(current)).to.eql(false);
      expect(await Fs.exists(legacy)).to.eql(false);
    } finally {
      if (holder) await stopLeaseHolder(holder);
      await resetGuiReleaseStores(workspace).catch(() => undefined);
      await Fs.remove(workspace);
    }
  });
});

async function rejectionOf(operation: () => Promise<unknown>): Promise<Error> {
  try {
    await operation();
  } catch (cause) {
    return Err.std(cause) as Error;
  }
  throw new Error('Expected GUI Dist reset rejection.');
}

async function startLeaseHolder(
  workspace: t.StringAbsoluteDir,
  targetPath: string,
  readiness: Readiness,
  timeout = PROCESS_TIMEOUT,
): Promise<LeaseHolder> {
  // Process.spawn intentionally owns null stdin; this proof requires two parent-to-child frames.
  const process = new Deno.Command(Deno.execPath(), {
    args: [
      'run',
      '--frozen',
      '--cached-only',
      '--no-prompt',
      '-P=clean',
      LEASE_HOLDER,
      workspace,
      targetPath,
      readiness,
    ],
    cwd: PACKAGE_ROOT,
    stdin: 'piped',
    stdout: 'piped',
    stderr: 'piped',
  }).spawn();
  const holder = Object.freeze({
    process,
    status: process.status,
    stdout: process.stdout.getReader(),
  });

  try {
    let continuedFragment = false;
    const continueFragment = readiness === 'fragmented'
      ? async () => {
        const writer = process.stdin.getWriter();
        try {
          await writer.write(new Uint8Array([1]));
          continuedFragment = true;
        } finally {
          writer.releaseLock();
        }
      }
      : undefined;
    const ready = await within(
      readFramedLine(holder.stdout, continueFragment),
      'reset lease-holder readiness',
      timeout,
    );
    if (ready !== Process.Signal.ready || (readiness === 'fragmented' && !continuedFragment)) {
      throw new Error(`Unexpected reset lease-holder readiness: ${ready}`);
    }
    return holder;
  } catch (cause) {
    try {
      await stopLeaseHolder(holder);
    } catch (cleanupCause) {
      throw new AggregateError(
        [cause, cleanupCause],
        'Reset lease-holder startup and cleanup both failed.',
      );
    }
    throw cause;
  }
}

async function readFramedLine(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onFragment?: () => Promise<void>,
): Promise<string> {
  const decoder = new TextDecoder();
  let buffered = '';
  let continueFrame = onFragment;

  while (true) {
    const part = await reader.read();
    if (part.done) {
      buffered += decoder.decode();
      throw new Error(`Reset lease holder exited before readiness: ${buffered}`);
    }
    buffered += decoder.decode(part.value, { stream: true });
    if (buffered.length > READINESS_LIMIT) {
      throw new Error('Reset lease-holder readiness exceeded its framing limit.');
    }

    const newline = buffered.indexOf('\n');
    if (newline < 0) {
      const resume = continueFrame;
      continueFrame = undefined;
      await resume?.();
      continue;
    }
    const line = buffered.slice(0, newline);
    if (buffered.slice(newline + 1).length > 0) {
      throw new Error('Reset lease-holder emitted bytes after its readiness frame.');
    }
    return line;
  }
}

async function expectHolderPending(holder: LeaseHolder): Promise<void> {
  const pending = Promise.withResolvers<'pending'>();
  const timer = Time.delay(100, () => pending.resolve('pending'));
  try {
    const state = await Promise.race([
      holder.status.then(() => 'settled' as const),
      pending.promise,
    ]);
    expect(state).to.eql('pending');
  } finally {
    timer.cancel();
  }
}

async function releaseLeaseHolder(
  holder: LeaseHolder,
): Promise<Readonly<{ status: Deno.CommandStatus; stderr: string }>> {
  const writer = holder.process.stdin.getWriter();
  await writer.write(new Uint8Array([1]));
  await writer.close();
  const status = await holder.status;
  const [remaining, stderr] = await Promise.all([
    holder.stdout.read(),
    new Response(holder.process.stderr).text(),
  ]);
  expect(remaining.done).to.eql(true);
  holder.stdout.releaseLock();
  return Object.freeze({ status, stderr });
}

async function stopLeaseHolder(holder: LeaseHolder): Promise<void> {
  try {
    holder.process.kill('SIGKILL');
  } catch {
    // Already exited.
  }

  let failure: unknown;
  try {
    await within(holder.status, 'forced lease-holder settlement');
  } catch (cause) {
    failure = cause;
  } finally {
    await holder.process.stdin.abort().catch(() => undefined);
    await holder.stdout.cancel().catch(() => undefined);
    try {
      holder.stdout.releaseLock();
    } catch {
      // Reader already released.
    }
    await holder.process.stderr.cancel().catch(() => undefined);
  }
  if (failure) throw failure;
}

async function within<T>(
  operation: Promise<T>,
  label: string,
  timeout = PROCESS_TIMEOUT,
): Promise<T> {
  const timedOut = Promise.withResolvers<never>();
  const timer = Time.delay(timeout, () => {
    timedOut.reject(new Error(`Timed out waiting for ${label}.`));
  });
  try {
    return await Promise.race([operation, timedOut.promise]);
  } finally {
    timer.cancel();
  }
}

async function storeSnapshots(workspace: t.StringAbsoluteDir): Promise<readonly TreeSnapshot[]> {
  return Object.freeze([
    await treeSnapshot(Fs.join(workspace, CURRENT.path)),
    await treeSnapshot(Fs.join(workspace, LEGACY.path)),
  ]);
}

async function treeSnapshot(root: t.StringPath): Promise<TreeSnapshot> {
  const entries: TreeEntrySnapshot[] = [];
  for await (
    const entry of Fs.walk(root, {
      includeDirs: true,
      includeFiles: true,
      includeSymlinks: true,
      followSymlinks: false,
    })
  ) {
    const info = await Deno.lstat(entry.path);
    if (info.isSymlink || !(info.isDirectory || info.isFile)) {
      throw new Error(`Unsupported reset process snapshot entry: ${entry.path}`);
    }
    const relative = Fs.Path.relative(root, entry.path).replaceAll('\\', '/') || '.';
    entries.push(Object.freeze({
      path: relative,
      kind: info.isDirectory ? 'directory' : 'file',
      dev: info.dev,
      ino: info.ino,
      mode: info.mode,
      ...(info.isFile ? { hash: Hash.sha256(await Deno.readFile(entry.path)) } : {}),
    }));
  }
  const compare = Str.Compare.codeUnit();
  entries.sort((a, b) => compare(a.path, b.path));
  return Object.freeze({ path: root, entries: Object.freeze(entries) });
}
