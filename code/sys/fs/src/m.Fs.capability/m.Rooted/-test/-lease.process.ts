import { describe, expect, Fs, it, setup, type t, teardown } from './u.fixture.ts';

const CHILD = Fs.Path.fromFileUrl(
  new URL('./u.fixture.lease.process.ts', import.meta.url),
) as t.StringAbsolutePath;

type LeaseChild = {
  readonly process: Deno.ChildProcess;
  readonly status: Promise<Deno.CommandStatus>;
};

function requireAcquired(result: t.FsRooted.LeaseResult): t.FsRooted.Lease {
  expect(result.kind).to.eql('acquired');
  if (result.kind !== 'acquired') throw new Error('Expected acquired Rooted lease.');
  return result.lease;
}

async function startChild(
  root: t.StringAbsoluteDir,
  mode: t.FsRooted.LeaseMode,
): Promise<LeaseChild> {
  const process = new Deno.Command(Deno.execPath(), {
    args: [
      'run',
      '-P=test-process-child',
      CHILD,
      root,
      'generation',
      mode,
    ],
    cwd: Deno.cwd(),
    stdin: 'piped',
    stdout: 'piped',
    stderr: 'piped',
  }).spawn();
  const child = { process, status: process.status };

  try {
    const reader = process.stdout.getReader();
    const ready = await reader.read();
    reader.releaseLock();
    if (ready.done) {
      const stderr = await new Response(process.stderr).text();
      throw new Error(`Rooted lease child exited before acquisition: ${stderr}`);
    }
    expect(new TextDecoder().decode(ready.value)).to.eql('acquired\n');
    return child;
  } catch (cause) {
    await stopChild(child);
    throw cause;
  }
}

async function stopChild(child: LeaseChild): Promise<Deno.CommandStatus> {
  try {
    child.process.kill('SIGKILL');
  } catch {
    // Already exited.
  }
  const status = await child.status;
  await child.process.stdin.abort().catch(() => undefined);
  await child.process.stdout.cancel().catch(() => undefined);
  await child.process.stderr.cancel().catch(() => undefined);
  return status;
}

async function contender(root: t.StringAbsoluteDir) {
  const rooted = await Fs.Capability.Rooted.create({ root });
  const admission = await rooted.Target.admit([{ kind: 'directory', path: 'generation' }]);
  return { rooted, target: admission.targets[0] };
}

describe('Fs.Capability.Rooted lifecycle lease processes', () => {
  it('releases exclusive OS ownership when a holding process dies', async () => {
    const fixture = await setup();
    let holder: LeaseChild | undefined;

    try {
      holder = await startChild(fixture.root, 'exclusive');
      const { rooted, target } = await contender(fixture.root);
      expect(await rooted.Lease.acquire([target], { mode: 'exclusive' })).to.eql({
        kind: 'busy',
        target,
      });

      const exited = await stopChild(holder);
      holder = undefined;
      expect(exited.success).to.eql(false);

      const lease = requireAcquired(
        await rooted.Lease.acquire([target], { mode: 'exclusive' }),
      );
      await lease.release();
    } finally {
      if (holder) await stopChild(holder);
      await teardown(fixture);
    }
  });

  it('admits shared holders across processes until every holder dies', async () => {
    const fixture = await setup();
    let first: LeaseChild | undefined;
    let second: LeaseChild | undefined;

    try {
      first = await startChild(fixture.root, 'shared');
      second = await startChild(fixture.root, 'shared');
      const { rooted, target } = await contender(fixture.root);
      const local = requireAcquired(
        await rooted.Lease.acquire([target], { mode: 'shared' }),
      );
      await local.release();

      expect(await rooted.Lease.acquire([target], { mode: 'exclusive' })).to.eql({
        kind: 'busy',
        target,
      });
      expect((await stopChild(first)).success).to.eql(false);
      first = undefined;
      expect(await rooted.Lease.acquire([target], { mode: 'exclusive' })).to.eql({
        kind: 'busy',
        target,
      });
      expect((await stopChild(second)).success).to.eql(false);
      second = undefined;

      const exclusive = requireAcquired(
        await rooted.Lease.acquire([target], { mode: 'exclusive' }),
      );
      await exclusive.release();
    } finally {
      if (first) await stopChild(first);
      if (second) await stopChild(second);
      await teardown(fixture);
    }
  });
});
