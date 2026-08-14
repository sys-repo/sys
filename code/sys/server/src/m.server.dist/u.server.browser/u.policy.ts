import { MediaType, Obj, type t } from './common.ts';
import type { BrowserPolicySnapshot } from '../u.server.input/u.browser.ts';
import { assetUrl } from './u.asset.ts';

export type BrowserRuntime = {
  readonly applied: t.DistServer.BrowserPolicy.Applied;
  readonly directWorkerAssets: readonly t.Files.String.Path[];
  readonly responseHeaders: t.DistServer.BrowserPolicy.Headers;
};

/** Admit only policy assets declared by the exact verified Dist. */
export function admitsVerifiedBrowserPolicy(
  policy: BrowserPolicySnapshot,
  evidence: t.FsPkg.Dist.Verify.Evidence,
): boolean {
  const parts = evidence.dist.hash.parts;
  for (const source of policy.dedicatedWorkers) {
    const path = source.kind === 'asset' ? source.path : source.worker;
    if (!Obj.hasOwn(parts, path) || !isJavaScript(path)) return false;
  }
  const serviceWorker = policy.serviceWorker;
  return serviceWorker.kind !== 'tombstone' ||
    (Obj.hasOwn(parts, serviceWorker.path) && isJavaScript(serviceWorker.path));
}

/** Build settled runtime policy and immutable applied-policy evidence. */
export function createBrowserRuntime(
  policy: BrowserPolicySnapshot,
  origin: t.StringUrl,
  host: string,
): BrowserRuntime {
  const responseHeaders = browserHeaders(policy, origin);
  const directWorkerAssets = Object.freeze(
    policy.dedicatedWorkers
      .filter((source) => source.kind === 'asset')
      .map((source) => source.path),
  );

  const applied: t.DistServer.BrowserPolicy.Applied = Object.freeze({
    kind: 'verified-loopback',
    origin,
    host,
    dedicatedWorkers: policy.dedicatedWorkers,
    serviceWorker: policy.serviceWorker,
    fetchMetadata: Object.freeze({
      crossSite: 'deny',
      missing: 'allow',
    }),
    headers: responseHeaders,
  });

  return Object.freeze({ applied, directWorkerAssets, responseHeaders });
}

/** Strict headers used before the selected listener has settled its exact origin. */
export function provisionalBrowserHeaders(): t.DistServer.BrowserPolicy.Headers {
  return fixedHeaders(
    "default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; object-src 'none'; worker-src 'none'",
  );
}

function browserHeaders(
  policy: BrowserPolicySnapshot,
  origin: t.StringUrl,
): t.DistServer.BrowserPolicy.Headers {
  const workerSources: string[] = [];
  for (const source of policy.dedicatedWorkers) {
    if (source.kind === 'blob') {
      workerSources.push('blob:');
    } else {
      workerSources.push(assetUrl(origin, source.path));
    }
  }
  if (policy.serviceWorker.kind === 'tombstone') {
    workerSources.push(assetUrl(origin, policy.serviceWorker.path));
  }
  const worker = workerSources.length === 0 ? "'none'" : [...new Set(workerSources)].join(' ');
  const contentSecurityPolicy = [
    "default-src 'none'",
    "base-uri 'none'",
    `child-src ${worker}`,
    "connect-src 'self'",
    "font-src 'self'",
    "form-action 'none'",
    "frame-ancestors 'none'",
    "frame-src 'none'",
    "img-src 'self' data:",
    "manifest-src 'self'",
    "media-src 'self'",
    "object-src 'none'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    `worker-src ${worker}`,
  ].join('; ');
  return fixedHeaders(contentSecurityPolicy);
}

function fixedHeaders(
  contentSecurityPolicy: string,
): t.DistServer.BrowserPolicy.Headers {
  return Object.freeze({
    cacheControl: 'no-store',
    contentSecurityPolicy,
    crossOriginOpenerPolicy: 'same-origin',
    crossOriginResourcePolicy: 'same-origin',
    referrerPolicy: 'no-referrer',
    xContentTypeOptions: 'nosniff',
    xFrameOptions: 'DENY',
  });
}

function isJavaScript(path: t.Files.String.Path): boolean {
  return MediaType.fromPath(path) === 'text/javascript';
}
