import type { t } from '../common.ts';
import { failure } from './u.error.ts';
import type { Io } from './u.io.ts';

/** Create the one private admission token inherited by a stage's descendants. */
export function stageActivity(ancestors: readonly t.RootedActivity[]): t.RootedActivity {
  return {
    ancestors,
    controller: new AbortController(),
    drained: new Set(),
    status: 'active',
    writer: 'unclaimed',
    borrowers: 0,
    sealing: false,
    closureLost: false,
  };
}

/** Acquire authority synchronously, before a method can start I/O or yield. */
export function borrowActivity(
  chain: readonly t.RootedActivity[],
  operation: t.FsRooted.Operation,
): () => void {
  for (const activity of chain) {
    if (
      activity.status !== 'active' || activity.writer !== 'unclaimed' || activity.sealing ||
      activity.closureLost
    ) {
      throw failure(operation, 'invalid-state');
    }
  }
  return retainActivity(chain);
}

/** Atomically claim an idle stage and retain its complete ancestor chain until settlement. */
export function claimWriter(activity: t.RootedActivity): () => void {
  if (activity.borrowers !== 0) throw failure('write-tree', 'invalid-state');
  const release = borrowActivity([...activity.ancestors, activity], 'write-tree');
  activity.writer = 'writing';
  return release;
}

/** Wait for admitted calls, then refuse destructive work if any owned close was unproved. */
export async function drainActivity(
  activity: t.RootedActivity,
  operation: t.FsRooted.Operation,
): Promise<void> {
  if (activity.borrowers !== 0) {
    await new Promise<void>((resolve) => activity.drained.add(resolve));
  }
  if (activity.closureLost) throw failure(operation, 'ownership-lost');
}

/** Keep public entrypoints explicit; composite operations call the unguarded private API once. */
export function guardRooted(
  api: t.FsRooted.Instance,
  chain: readonly t.RootedActivity[],
  resolveStage: (tree: t.FsRooted.OwnedTree) => t.RootedActivity | undefined,
): t.FsRooted.Instance {
  const run = async <T>(
    operation: t.FsRooted.Operation,
    fn: () => Promise<T>,
    stage?: t.RootedActivity,
  ): Promise<T> => {
    // Sealing traverses the whole stage, including every nested writer's private content.
    const seal = operation === 'seal-tree' ? stage : undefined;
    if (seal && seal.borrowers !== 0) throw failure(operation, 'invalid-state');
    const release = borrowActivity(stage ? [...chain, stage] : chain, operation);
    if (seal) seal.sealing = true;
    try {
      return await fn();
    } finally {
      if (seal) seal.sealing = false;
      release();
    }
  };
  return Object.freeze<t.FsRooted.Instance>({
    path: api.path,
    Target: Object.freeze<t.FsRooted.Instance['Target']>({
      admit: (targets, options) => run('admit', () => api.Target.admit(targets, options)),
    }),
    Lease: Object.freeze<t.FsRooted.Instance['Lease']>({
      acquire: (targets, options) =>
        run('acquire-lease', () => api.Lease.acquire(targets, options)),
    }),
    Tree: Object.freeze<t.FsRooted.Instance['Tree']>({
      inspectSeal: (tree, options) =>
        run(
          'inspect-seal',
          () => api.Tree.inspectSeal(tree, options),
          resolveStage(tree),
        ),
      seal: (tree, options) =>
        run('seal-tree', () => api.Tree.seal(tree, options), resolveStage(tree)),
      remove: (target, options) => run('remove-tree', () => api.Tree.remove(target, options)),
      removeBatch: (targets, options) =>
        run('remove-tree-batch', () => api.Tree.removeBatch(targets, options)),
    }),
    File: Object.freeze<t.FsRooted.Instance['File']>({
      publish: (target, bytes, options) =>
        run('publish-file', () => api.File.publish(target, bytes, options)),
    }),
    Stage: Object.freeze<t.FsRooted.Instance['Stage']>({
      create: (options) => run('create-stage', () => api.Stage.create(options)),
      discard: (stage, options) => run('discard-stage', () => api.Stage.discard(stage, options)),
      promote: (stage, target, options) =>
        run('promote-stage', () => api.Stage.promote(stage, target, options)),
    }),
  });
}

/** Track unproved handle closure, not caller-owned lease lifetime or per-entry cleanup ownership. */
export function activityIo(io: Io, chain: readonly t.RootedActivity[]): Io {
  if (chain.length === 0) return io;
  const lost = () => {
    for (const activity of chain) activity.closureLost = true;
  };
  return {
    ...io,
    async open(path, options) {
      const file = await io.open(path, options);
      return {
        read: (bytes) => file.read(bytes),
        write: (bytes) => file.write(bytes),
        sync: () => file.sync(),
        stat: () => file.stat(),
        tryLock: (exclusive) => file.tryLock(exclusive),
        unlock: () => file.unlock(),
        close() {
          try {
            file.close();
          } catch (cause) {
            lost();
            throw cause;
          }
        },
      };
    },
    async openMode(path) {
      const file = await io.openMode(path);
      return {
        stat: () => file.stat(),
        chmod: (mode) => file.chmod(mode),
        async close() {
          try {
            await file.close();
          } catch (cause) {
            lost();
            throw cause;
          }
        },
      };
    },
  };
}

function retainActivity(chain: readonly t.RootedActivity[]): () => void {
  for (const activity of chain) activity.borrowers += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    for (const activity of chain) {
      activity.borrowers -= 1;
      if (activity.borrowers !== 0) continue;
      for (const resolve of activity.drained) resolve();
      activity.drained.clear();
    }
  };
}
