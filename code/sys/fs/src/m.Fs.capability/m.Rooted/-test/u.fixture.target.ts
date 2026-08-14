import { expect, type t } from './u.fixture.ts';

/** Admit one directory target and return its instance-bound handle. */
export async function directoryTarget(
  rooted: t.FsRooted.Instance,
  path: string,
): Promise<t.FsRooted.Target<'directory'>> {
  const admission = await rooted.admit([{ kind: 'directory', path }]);
  return admission.targets[0];
}

/** Acquire and unwrap one lease; a busy result is a fixture failure. */
export async function acquiredLease(
  rooted: t.FsRooted.Instance,
  target: t.FsRooted.Target<'directory'>,
  mode: t.FsRooted.LeaseMode,
): Promise<t.FsRooted.Lease> {
  const result = await rooted.acquireLease([target], { mode });
  expect(result.kind).to.eql('acquired');
  if (result.kind !== 'acquired') throw new Error('Expected acquired Rooted lease.');
  return result.lease;
}
