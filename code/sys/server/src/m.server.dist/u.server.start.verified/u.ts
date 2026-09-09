import type { StartDependencies, StartRunOptions, t } from '../u.server.start/common.ts';
import { DistServerError, startError } from '../u.server/u.error.ts';
import * as Listener from '../u.server.start/u.lifecycle.ts';
import { isPromiseTransportReady } from '../u.server.start/u.promise.ts';
import { startVerifiedListener } from './u.listener.ts';
import { createVerifiedRequestTransport } from './u.request.ts';
import { publishVerifiedResult } from './u.result.ts';

/**
 * Start hosting one freshly verified Dist under its selected listener authority.
 *
 * Listener acquisition, authority binding, first-turn settlement, publication, and rollback remain
 * ordered in this orchestration boundary.
 */
export async function serveVerified(
  input: t.DistServer.Start.Args | t.DistServer.Local.Args,
  evidence: t.FsPkg.Dist.Verify.Evidence,
  authority: t.DistServer.Started['authority'],
  life: t.Abortable,
  deps: StartDependencies,
  options: StartRunOptions = {},
): Promise<t.DistServer.Started> {
  let started: t.HttpServer.Started | undefined;
  let owner: Listener.ListenerOwner | undefined;
  let observed: Listener.ListenerObservation | undefined;
  const strictPort = options.strictPort ?? true;

  try {
    const transport = createVerifiedRequestTransport({ input, evidence, authority, life, deps });

    if (life.signal.aborted) throw startError('cancelled');
    assertPromiseTransport();
    started = startVerifiedListener({
      app: transport.app,
      input,
      evidence,
      life,
      deps,
      strictPort,
      options,
    });

    owner = Listener.snapshotListenerOwner(started);
    if (!Listener.isCompleteListenerOwner(owner)) throw startError('startup-failure');
    observed = observeOwner(owner, life);
    assertPromiseTransport();

    if (strictPort && input.port !== 0 && owner.port !== input.port) {
      throw startError('address-in-use');
    }
    const browserRuntime = transport.bindAuthority(owner);

    await Listener.settleListener(observed);
    assertPromiseTransport();
    if (life.signal.aborted) throw startError('cancelled');

    return publishVerifiedResult({ started, authority, evidence, browserRuntime });
  } catch (cause) {
    if (owner) await Listener.rollbackListenerOwner(owner, observed);
    else if (started) {
      await Listener.rollbackListenerOwner(Listener.snapshotListenerOwner(started));
    }
    Listener.disposeLifeWhenReady(life);
    if (DistServerError.is(cause)) throw cause;
    throw startError('startup-failure');
  }
}

/**
 * Helpers:
 */
function observeOwner(
  owner: Listener.CompleteListenerOwner,
  life: t.Abortable,
): Listener.ListenerObservation {
  return Listener.observeListener(
    owner.finished,
    () => Listener.disposeLifeWhenReady(life, 'server.finished'),
  );
}

function assertPromiseTransport(): void {
  if (!isPromiseTransportReady()) throw startError('startup-failure');
}
