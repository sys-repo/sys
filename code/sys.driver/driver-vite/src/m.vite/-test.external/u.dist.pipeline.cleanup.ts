import { Fs } from '../../-test.ts';

type Cleanup = {
  hosts: readonly { close(): Promise<unknown> }[];
  dispose(): Promise<unknown>;
  removeStores(): Promise<unknown>;
  removeRoot(): Promise<unknown>;
};

/** Settle this pipeline's body and ordered cleanup without replacing independent failures. */
export async function runPipeline(body: () => Promise<void>, cleanup: Cleanup): Promise<void> {
  const failures: unknown[] = [];
  const attempt = async (operation: () => Promise<unknown>) => {
    try {
      await operation();
      return true;
    } catch (cause) {
      failures.push(cause);
      return false;
    }
  };
  await attempt(body);
  const closed = await Promise.allSettled(cleanup.hosts.map(async (host) => await host.close()));
  for (const result of closed) {
    if (result.status === 'rejected') failures.push(result.reason);
  }
  await attempt(() => cleanup.dispose());
  // Refused store removal does not authorize recursive deletion around that refusal.
  if (await attempt(() => cleanup.removeStores())) await attempt(() => cleanup.removeRoot());
  if (failures.length === 1) throw failures[0];
  if (failures.length > 1) {
    throw new AggregateError(failures, 'Dist pipeline body or cleanup failed.');
  }
}

/** The fixture owns its sealed stores; removal and lease release have independent outcomes. */
export async function removeStores(root: string): Promise<void> {
  if (!(await Fs.exists(Fs.join(root, 'stores')))) return;
  const rooted = await Fs.Capability.Rooted.create({ root });
  const admitted = await rooted.Target.admit([{ kind: 'directory', path: 'stores' }]);
  const acquired = await rooted.Lease.acquire(admitted.targets, { mode: 'exclusive' });
  if (acquired.kind !== 'acquired') throw new Error('Pipeline fixture store is busy.');
  const failures: unknown[] = [];
  try {
    await rooted.Tree.remove(admitted.targets[0], { lease: acquired.lease });
  } catch (cause) {
    failures.push(cause);
  }
  try {
    await acquired.lease.release();
  } catch (cause) {
    failures.push(cause);
  }
  if (failures.length === 1) throw failures[0];
  if (failures.length > 1) {
    throw new AggregateError(failures, 'Pipeline store removal and release failed.');
  }
}
