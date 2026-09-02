import { describe, expect, Fs, it, setup, teardown } from './u.fixture.ts';
import { toLockName } from '../u/u.lock.ts';
import { directoryTarget } from './u.fixture.target.ts';
import { writeDistTree as writeTree } from './u.fixture.tree.ts';

const CHILD = Fs.Path.fromFileUrl(
  new URL('./u.fixture.removeTreeBatch.process.ts', import.meta.url),
);

type BatchHolder = {
  readonly process: Deno.ChildProcess;
  readonly status: Promise<Deno.CommandStatus>;
};

async function startHolder(root: string, paths: readonly string[]): Promise<BatchHolder> {
  const process = new Deno.Command(Deno.execPath(), {
    args: [
      'run',
      '-P=test-process-child',
      CHILD,
      root,
      ...paths,
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
    if (ready.done || new TextDecoder().decode(ready.value) !== 'acquired\n') {
      const stderr = await new Response(process.stderr).text();
      throw new Error(`Rooted batch holder failed before acquisition: ${stderr}`);
    }
    return child;
  } catch (cause) {
    await stopHolder(child);
    throw cause;
  }
}

async function releaseHolder(child: BatchHolder): Promise<void> {
  const writer = child.process.stdin.getWriter();
  await writer.write(new Uint8Array([1]));
  await writer.close();
  writer.releaseLock();
  const status = await child.status;
  const stderr = status.success ? '' : await new Response(child.process.stderr).text();
  await child.process.stdout.cancel();
  if (status.success) await child.process.stderr.cancel();
  if (!status.success) {
    throw new Error(`Rooted batch holder failed during release: ${stderr}`);
  }
}

async function stopHolder(child: BatchHolder): Promise<void> {
  try {
    child.process.kill('SIGKILL');
  } catch {
    // Already exited.
  }
  await child.status;
  await child.process.stdin.abort().catch(() => undefined);
  await child.process.stdout.cancel().catch(() => undefined);
  await child.process.stderr.cancel().catch(() => undefined);
}

describe('Fs.Capability.Rooted.removeTreeBatch process ownership', () => {
  it('maps stable-order contention across opposing caller orders and removes sealed trees after release', async () => {
    const fixture = await setup();
    let holder: BatchHolder | undefined;
    try {
      const first = await writeTree(fixture.root, 'alpha');
      const second = await writeTree(fixture.root, 'bravo');
      const sibling = await writeTree(fixture.root, 'sibling');
      const stable = ['alpha', 'bravo'].sort((left, right) => {
        const leftLock = toLockName(left);
        const rightLock = toLockName(right);
        return leftLock < rightLock ? -1 : leftLock > rightLock ? 1 : 0;
      });
      const owner = await Fs.Capability.Rooted.create({ root: fixture.root });
      for (const path of stable) {
        const target = await directoryTarget(owner, path);
        expect(await owner.sealTree(target)).to.eql({ kind: 'applied', changed: true });
      }

      holder = await startHolder(fixture.root, stable);
      const callerOrder = [stable[1], stable[0]];
      const busy = await owner.removeTreeBatch(callerOrder);
      expect(busy).to.eql({ kind: 'busy', index: 1, path: stable[0] });
      expect(await Fs.exists(first)).to.eql(true);
      expect(await Fs.exists(second)).to.eql(true);

      await releaseHolder(holder);
      holder = undefined;
      expect(await owner.removeTreeBatch(callerOrder)).to.eql({
        kind: 'settled',
        results: [
          { index: 0, path: stable[1], kind: 'removed' },
          { index: 1, path: stable[0], kind: 'removed' },
        ],
      });
      expect(await Fs.exists(first)).to.eql(false);
      expect(await Fs.exists(second)).to.eql(false);
      expect(await Deno.readTextFile(Fs.join(sibling, 'dist.json'))).to.eql('manifest');

      const lockNames: string[] = [];
      for await (const entry of Deno.readDir(Fs.join(fixture.root, '.sys.rooted', 'locks'))) {
        lockNames.push(entry.name);
      }
      expect(lockNames.sort()).to.eql(stable.map(toLockName).sort());
    } finally {
      if (holder) await stopHolder(holder);
      await teardown(fixture);
    }
  });
});
