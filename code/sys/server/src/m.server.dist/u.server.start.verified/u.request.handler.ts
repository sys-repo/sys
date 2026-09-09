import { Files, type StartDependencies, type t } from '../u.server.start/common.ts';
import * as Browser from '../u.server.browser/mod.ts';
import { startError } from '../u.server/u.error.ts';
import { acceptedAuthorities, acceptsHost, exactAuthority } from '../../u.server.request.ts';
import { requestPath } from '../u.server/u.path.ts';
import { readAsset, readManifest } from '../u.server/u.read.ts';

export type VerifiedRequestArgs = Readonly<{
  input: t.DistServer.Start.Args | t.DistServer.Local.Args;
  evidence: t.FsPkg.Dist.Verify.Evidence;
  authority: t.DistServer.Started['authority'];
  life: t.Abortable;
  deps: StartDependencies;
}>;

export type VerifiedRequestHandler = Readonly<{
  handle(context: t.HttpServer.Hono.Context): Promise<Response>;
  bindAuthority(listener: ListenerAuthority): Browser.BrowserRuntime | undefined;
}>;

type ListenerAuthority = Readonly<{
  origin: t.StringUrl;
  hostname: t.StringHostname;
  port: t.PortNumber;
  addrHostname: string;
  signal: AbortSignal;
}>;

type BrowserGate =
  | Readonly<{ kind: 'none' }>
  | Readonly<{
    kind: 'policy';
    policy: NonNullable<VerifiedRequestArgs['input']['browserPolicy']>;
    provisionalHeaders: t.DistServer.BrowserPolicy.Headers;
  }>;

type RequestRuntime = {
  hosts?: ReadonlySet<string>;
  listenerSignal?: AbortSignal;
  browserRuntime?: Browser.BrowserRuntime;
};

type ServePathArgs = Readonly<{
  args: VerifiedRequestArgs;
  backing: t.FilesStatic.Readonly;
  request: Request;
  path: t.Files.String.Path | undefined;
  signal: AbortSignal;
}>;

type RequestContext = t.HttpServer.Hono.Context;

/**
 * Create the request handler and listener-authority gate for one verified Dist.
 */
export function createVerifiedRequestHandler(
  args: VerifiedRequestArgs,
): VerifiedRequestHandler {
  const { input, evidence, deps } = args;
  const browser = createBrowserGate(input.browserPolicy, evidence);
  const backing = createBacking(evidence, deps);
  const runtime: RequestRuntime = {};
  const handle = createHandler(args, browser, backing, runtime);

  return {
    handle,
    bindAuthority(listener) {
      return bindListenerAuthority(browser, runtime, listener);
    },
  };
}

/**
 * Helpers:
 */
function createHandler(
  args: VerifiedRequestArgs,
  browser: BrowserGate,
  backing: t.FilesStatic.Readonly,
  runtime: RequestRuntime,
) {
  return async function handleVerifiedRequest(context: RequestContext): Promise<Response> {
    const request = context.req.raw;
    const browserHeaders = browser.kind === 'policy'
      ? runtime.browserRuntime?.responseHeaders ?? browser.provisionalHeaders
      : undefined;
    if (!runtime.hosts || !acceptsHost(request, runtime.hosts)) {
      return hostRejected(browserHeaders);
    }

    try {
      if (browser.kind === 'policy') {
        const policyHeaders = runtime.browserRuntime?.responseHeaders ?? browser.provisionalHeaders;
        if (!Browser.acceptsFetchSite(request)) {
          return Browser.browserRejected(403, policyHeaders);
        }

        const path = requestPath(request);
        if (
          !runtime.browserRuntime ||
          !Browser.acceptsWorkerDestination(
            request,
            path,
            browser.policy,
            runtime.browserRuntime.directWorkerAssets,
          )
        ) {
          return Browser.browserRejected(403, policyHeaders);
        }

        const response = await servePath({
          args,
          backing,
          request,
          path,
          signal: runtime.listenerSignal ?? args.life.signal,
        });
        return Browser.applyBrowserHeaders(response, policyHeaders);
      }

      return await servePath({
        args,
        backing,
        request,
        path: requestPath(request),
        signal: runtime.listenerSignal ?? args.life.signal,
      });
    } catch (cause) {
      if (browserHeaders) return Browser.browserRejected(500, browserHeaders);
      throw cause;
    }
  };
}

function bindListenerAuthority(
  browser: BrowserGate,
  runtime: RequestRuntime,
  listener: ListenerAuthority,
): Browser.BrowserRuntime | undefined {
  runtime.listenerSignal = listener.signal;
  if (browser.kind === 'policy') {
    const host = exactAuthority({ origin: listener.origin });
    runtime.browserRuntime = Browser.createBrowserRuntime(browser.policy, listener.origin, host);
    runtime.hosts = new Set([host]);
  } else {
    runtime.hosts = acceptedAuthorities({
      hostname: listener.hostname,
      port: listener.port,
      addr: { hostname: listener.addrHostname },
    });
  }
  return runtime.browserRuntime;
}

function createBrowserGate(
  policy: VerifiedRequestArgs['input']['browserPolicy'],
  evidence: t.FsPkg.Dist.Verify.Evidence,
): BrowserGate {
  if (!policy) return { kind: 'none' };
  if (!Browser.admitsVerifiedBrowserPolicy(policy, evidence)) {
    throw startError('invalid-input');
  }
  return {
    kind: 'policy',
    policy,
    provisionalHeaders: Browser.provisionalBrowserHeaders(),
  };
}

function createBacking(
  evidence: t.FsPkg.Dist.Verify.Evidence,
  deps: StartDependencies,
): t.FilesStatic.Readonly {
  try {
    return deps.fromDist({
      dist: evidence.dist,
      policy: Files.Policy.readonly('**'),
    });
  } catch {
    throw startError('startup-failure');
  }
}

function servePath(input: ServePathArgs): Promise<Response> {
  const { args, backing, request, path, signal } = input;
  const { input: host, evidence, authority, deps } = args;
  if (!path) {
    return deps.serveBytes({
      req: request,
      path: 'invalid',
      cache: 'no-store',
      read: () => Promise.resolve({ kind: 'missing' }),
    });
  }

  if (path === 'dist.json' && authority.kind === 'local-unpinned') {
    return deps.serveBytes({
      req: request,
      path,
      cache: 'no-store',
      read: () =>
        readManifest({
          dir: host.dir,
          integrity: evidence.integrity,
          size: evidence.manifestBytes,
          until: signal,
          deps,
        }),
    });
  }

  return deps.serveBytes({
    req: request,
    path,
    cache: 'no-store',
    read: () =>
      readAsset({
        backing,
        dir: host.dir,
        path,
        signal,
        until: signal,
        local: authority.kind === 'local-unpinned',
        deps,
      }),
  });
}

function hostRejected(policy?: t.DistServer.BrowserPolicy.Headers): Response {
  const response = new Response(null, {
    status: 421,
    headers: { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' },
  });
  return policy ? Browser.applyBrowserHeaders(response, policy) : response;
}
