import { HttpServer, Is, Random, type t } from '../common.ts';
import { acceptsFetchSite, acceptsHost, exactAuthority } from '../../u.server.request.ts';
import { isStartError, startError } from './u.error.ts';
import { snapshotInput } from './u.input.ts';
import {
  retainLowerStarted,
  rollbackLowerOwner,
  settleListener,
  toPublicStarted,
} from './u.lifecycle.ts';
import {
  isCompleteLowerOwner,
  type ListenerObservation,
  type LowerOwner,
  observeListener,
  snapshotLowerOwner,
} from './u.listener.ts';
import { isPromiseTransportReady, microtaskPromise } from './u.promise.ts';
import {
  forbiddenResponse,
  misdirectedResponse,
  type ResponseContext,
  statusResponse,
} from './u.response.ts';

export type StartDependencies = {
  readonly capability: () => string;
  readonly createApp: typeof HttpServer.create;
  readonly startHttp: typeof HttpServer.start;
};

export const DEFAULT_DEPENDENCIES: StartDependencies = Object.freeze({
  capability: () => Random.base36(48),
  createApp: HttpServer.create,
  startHttp: HttpServer.start,
});

const CAPABILITY_PATTERN = /^[0-9a-z]{48}$/;
const freeze = Object.freeze;

/**
 * Start one launch-scoped inert bootstrap-status host.
 */
export const start: t.BootstrapStatus.Lib['start'] = (input) => startWith(input);

/** Internal deterministic startup seam. */
export async function startWith(
  input: unknown,
  deps: StartDependencies = DEFAULT_DEPENDENCIES,
): Promise<t.BootstrapStatus.Started> {
  const prepared = snapshotInput(input);
  if (!prepared) throw startError('invalid input');

  let started: t.HttpServer.Started | undefined;
  let owner: LowerOwner | undefined;
  let observed: ListenerObservation | undefined;
  try {
    await microtaskPromise();
    assertPromiseTransport();

    const capability = deps.capability();
    if (!Is.string(capability) || !CAPABILITY_PATTERN.test(capability)) throw startError('failed');
    const capabilityPath = `/${capability}`;
    const app = deps.createApp({ static: false, cors: false });
    const authority: {
      host?: ReadonlySet<string>;
      response?: ResponseContext;
    } = {};

    app.all('*', (context) => {
      const request = context.req.raw;
      if (!authority.host || !acceptsHost(request, authority.host)) {
        return misdirectedResponse(request);
      }
      if (!acceptsFetchSite(request)) return forbiddenResponse(request);
      return authority.response
        ? statusResponse(request, authority.response)
        : misdirectedResponse(request);
    });

    assertPromiseTransport();
    started = deps.startHttp(app, {
      hostname: '127.0.0.1',
      port: 0,
      origin: 'exact-loopback',
      silent: true,
      status: { kind: 'bootstrap-status' },
    });
    owner = snapshotLowerOwner(started);
    if (!isCompleteLowerOwner(owner)) throw startError('failed');
    observed = observeListener(owner.finished);
    assertPromiseTransport();

    authority.host = new Set([exactAuthority({ origin: owner.origin })]);
    authority.response = freeze({
      ...prepared,
      capabilityPath,
      origin: owner.origin,
    });
    const url: t.StringUrl = `${owner.origin}${capabilityPath}`;

    await settleListener(observed);
    assertPromiseTransport();
    return toPublicStarted(owner, observed, url);
  } catch (cause) {
    if (owner) await rollbackLowerOwner(owner, observed);
    else if (started) retainLowerStarted(started);
    if (isStartError(cause)) throw cause;
    throw startError('failed');
  }
}

function assertPromiseTransport(): void {
  if (!isPromiseTransportReady()) throw startError('failed');
}
