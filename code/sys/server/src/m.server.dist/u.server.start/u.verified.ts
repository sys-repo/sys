import { Files, type StartDependencies, type StartRunOptions, type t } from './common.ts';
import {
  acceptsFetchSite,
  acceptsWorkerDestination,
  admitsVerifiedBrowserPolicy,
  applyBrowserHeaders,
  browserRejected,
  type BrowserRuntime,
  createBrowserRuntime,
  provisionalBrowserHeaders,
} from '../u.server.browser/mod.ts';
import { DistServerError, startError, startupReason } from '../u.server/u.error.ts';
import { acceptedAuthorities, acceptsHost, exactAuthority } from '../../u.server.request.ts';
import { requestPath } from '../u.server/u.path.ts';
import { readAsset } from '../u.server/u.read.ts';
import {
  type CompleteListenerOwner,
  disposeLifeWhenReady,
  isCompleteListenerOwner,
  type ListenerObservation,
  type ListenerOwner,
  observeListener,
  rollbackListenerOwner,
  settleListener,
  snapshotListenerOwner,
} from './u.lifecycle.ts';
import { isPromiseTransportReady } from './u.promise.ts';

const defineProperties = Object.defineProperties;
const freeze = Object.freeze;

/** Host one freshly verified Dist under its selected listener authority. */
export async function serveVerified(
  input: t.DistServer.Start.Args | t.DistServer.Local.Args,
  evidence: t.FsPkg.Dist.Verify.Evidence,
  authority: t.DistServer.Started['authority'],
  life: t.Abortable,
  deps: StartDependencies,
  options: StartRunOptions = {},
): Promise<t.DistServer.Started> {
  let started: t.HttpServer.Started | undefined;
  let owner: ListenerOwner | undefined;
  let observed: ListenerObservation | undefined;
  const strictPort = options.strictPort ?? true;

  try {
    const browserPolicy = input.browserPolicy;
    if (browserPolicy && !admitsVerifiedBrowserPolicy(browserPolicy, evidence)) {
      throw startError('invalid-input');
    }

    let backing: t.FilesStatic.Readonly;
    try {
      backing = deps.fromDist({
        dist: evidence.dist,
        policy: Files.Policy.readonly('**'),
      });
    } catch {
      throw startError('startup-failure');
    }

    const app = deps.createApp({ static: false, cors: false });
    const hosts = { hosts: undefined as undefined | ReadonlySet<string> };
    const provisionalHeaders = browserPolicy ? provisionalBrowserHeaders() : undefined;
    let browserRuntime: BrowserRuntime | undefined;
    const readSignal = () => owner?.signal ?? life.signal;
    app.all('*', async (context) => {
      const request = context.req.raw;
      const browserHeaders = browserRuntime?.responseHeaders ?? provisionalHeaders;
      if (!hosts.hosts || !acceptsHost(request, hosts.hosts)) {
        return hostRejected(browserHeaders);
      }

      try {
        if (browserPolicy && !acceptsFetchSite(request)) {
          return browserRejected(403, browserHeaders!);
        }

        const path = requestPath(request);
        if (
          browserPolicy &&
          (!browserRuntime ||
            !acceptsWorkerDestination(
              request,
              path,
              browserPolicy,
              browserRuntime.directWorkerAssets,
            ))
        ) {
          return browserRejected(403, browserHeaders!);
        }

        const response = !path
          ? await deps.serveBytes({
            req: request,
            path: 'invalid',
            cache: 'no-store',
            read: () => Promise.resolve({ kind: 'missing' }),
          })
          : await deps.serveBytes({
            req: request,
            path,
            cache: 'no-store',
            read: () => {
              const signal = readSignal();
              return readAsset({
                backing,
                dir: input.dir,
                path,
                signal,
                until: signal,
                deps,
              });
            },
          });
        return browserHeaders ? applyBrowserHeaders(response, browserHeaders) : response;
      } catch (cause) {
        if (browserHeaders) return browserRejected(500, browserHeaders);
        throw cause;
      }
    });

    if (life.signal.aborted) throw startError('cancelled');
    assertPromiseTransport();
    try {
      started = deps.startHttp(app, {
        hostname: input.hostname,
        port: input.port,
        ...(browserPolicy === undefined ? {} : { origin: 'exact-loopback' as const }),
        ...(input.name === undefined ? {} : { name: input.name }),
        ...(input.silent === undefined ? {} : { silent: input.silent }),
        ...(input.keyboard === undefined ? {} : { keyboard: input.keyboard }),
        ...(options.rawOutput
          ? {
            pkg: evidence.dist.pkg,
            hash: evidence.dist.hash.digest,
            ...(options.rawAuthority === undefined
              ? {}
              : { info: { authority: options.rawAuthority } }),
          }
          : {}),
        until: life.signal,
        status: { kind: 'dist', root: input.dir, urlPaths: ['/'] },
      });
    } catch (cause) {
      throw startError(startupReason(cause));
    }
    owner = snapshotListenerOwner(started);
    if (!isCompleteListenerOwner(owner)) throw startError('startup-failure');
    observed = observeOwner(owner, life);
    assertPromiseTransport();

    if (strictPort && input.port !== 0 && owner.port !== input.port) {
      throw startError('address-in-use');
    }
    if (browserPolicy) {
      const host = exactAuthority({ origin: owner.origin });
      browserRuntime = createBrowserRuntime(browserPolicy, owner.origin, host);
      hosts.hosts = new Set([host]);
    } else {
      hosts.hosts = acceptedAuthorities({
        hostname: owner.hostname,
        port: owner.port,
        addr: { hostname: owner.addrHostname },
      });
    }
    await settleListener(observed);
    assertPromiseTransport();
    if (life.signal.aborted) throw startError('cancelled');

    defineProperties(started, {
      authority: {
        value: freeze(authority),
        enumerable: true,
        writable: false,
        configurable: false,
      },
      verification: {
        value: freeze(evidence),
        enumerable: true,
        writable: false,
        configurable: false,
      },
      ...(browserRuntime
        ? {
          browserPolicy: {
            value: browserRuntime.applied,
            enumerable: true,
            writable: false,
            configurable: false,
          },
        }
        : {}),
    });

    return started as t.DistServer.Started;
  } catch (cause) {
    if (owner) await rollbackListenerOwner(owner, observed);
    else if (started) await rollbackListenerOwner(snapshotListenerOwner(started));
    disposeLifeWhenReady(life);
    if (DistServerError.is(cause)) throw cause;
    throw startError('startup-failure');
  }
}

function observeOwner(
  owner: CompleteListenerOwner,
  life: t.Abortable,
): ListenerObservation {
  return observeListener(
    owner.finished,
    () => disposeLifeWhenReady(life, 'server.finished'),
  );
}

function assertPromiseTransport(): void {
  if (!isPromiseTransportReady()) throw startError('startup-failure');
}

function hostRejected(policy?: t.DistServer.BrowserPolicy.Headers): Response {
  const response = new Response(null, {
    status: 421,
    headers: {
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  });
  return policy ? applyBrowserHeaders(response, policy) : response;
}
