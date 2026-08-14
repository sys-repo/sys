import {
  DEFAULT_DEPENDENCIES,
  Rx,
  Schedule,
  type StartDependencies,
  type StartRunOptions,
  type t,
} from './common.ts';
import { snapshotStartInput, snapshotStartLocalInput } from '../u.server.input/u.start.ts';
import { DistServerError, startError } from '../u.server/u.error.ts';
import { serveVerified } from './u.verified.ts';

/** Start one checksum-pinned local Dist host. */
export const start: (input: t.DistServer.Start.Args) => Promise<t.DistServer.Started> = (input) =>
  startWith(input, DEFAULT_DEPENDENCIES);

/** Internal deterministic pinned-hosting dependency seam. */
export async function startWith(
  input: unknown,
  deps: StartDependencies,
  options: StartRunOptions = {},
): Promise<t.DistServer.Started> {
  const prepared = snapshotStartInput(input);
  if (!prepared.ok) throw startError(prepared.reason);

  let life: t.Abortable;
  try {
    life = Rx.abortable(prepared.value.until);
  } catch {
    throw startError('invalid-input');
  }

  try {
    await Schedule.micro();
    if (life.signal.aborted) throw startError('cancelled');

    let verified: t.FsPkg.Dist.Verify.Result;
    try {
      verified = await deps.verify({
        dir: prepared.value.dir,
        integrity: prepared.value.integrity,
        limits: prepared.value.limits,
        until: life.signal,
      });
    } catch {
      throw startError('startup-failure');
    }

    if (verified.kind !== 'verified') throw startError(verified.kind);
    if (life.signal.aborted) throw startError('cancelled');

    return await serveVerified(
      prepared.value,
      verified.evidence,
      { kind: 'pinned', integrity: prepared.value.integrity },
      life,
      deps,
      options,
    );
  } catch (cause) {
    life?.dispose();
    if (DistServerError.is(cause)) throw cause;
    throw startError('startup-failure');
  }
}

/** Internal deterministic locally verified hosting dependency seam. */
export async function startLocalWith(
  input: unknown,
  deps: StartDependencies,
  options: StartRunOptions = {},
): Promise<t.DistServer.Started> {
  const prepared = snapshotStartLocalInput(input);
  if (!prepared.ok) throw startError(prepared.reason);

  let life: t.Abortable;
  try {
    life = Rx.abortable(prepared.value.until);
  } catch {
    throw startError('invalid-input');
  }

  try {
    await Schedule.micro();
    if (life.signal.aborted) throw startError('cancelled');

    let verified: t.FsPkg.Dist.Verify.Result;
    try {
      verified = await deps.verifyLocal({
        dir: prepared.value.dir,
        limits: prepared.value.limits,
        until: life.signal,
      });
    } catch {
      throw startError('startup-failure');
    }

    if (verified.kind !== 'verified') throw startError(verified.kind);
    if (life.signal.aborted) throw startError('cancelled');

    return await serveVerified(
      prepared.value,
      verified.evidence,
      { kind: 'local-unpinned', integrity: verified.evidence.integrity },
      life,
      deps,
      options,
    );
  } catch (cause) {
    life?.dispose();
    if (DistServerError.is(cause)) throw cause;
    throw startError('startup-failure');
  }
}
