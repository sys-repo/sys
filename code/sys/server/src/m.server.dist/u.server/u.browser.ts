import { Is, MediaType, Num, Obj, type t } from '../common.ts';
import { snapshotRecord } from './u.input/u.record.ts';

const POLICY_KEYS = ['kind', 'dedicatedWorkers', 'serviceWorker'] as const;
const SOURCE_KEYS = ['kind', 'path', 'worker'] as const;
const SERVICE_WORKER_KEYS = ['kind', 'path'] as const;

/** Sentinel returned when an explicitly supplied browser policy is malformed. */
export const INVALID_BROWSER_POLICY = Symbol('invalid-browser-policy');

export type BrowserPolicySnapshot = t.DistServer.BrowserPolicy.Input;

export type BrowserRuntime = {
  readonly applied: t.DistServer.BrowserPolicy.Applied;
  readonly directWorkerAssets: readonly t.Files.String.Path[];
  readonly responseHeaders: t.DistServer.BrowserPolicy.Headers;
};

/** Snapshot one closed browser-policy input without invoking caller accessors. */
export function snapshotBrowserPolicy(
  input: unknown,
  maxSources: number,
): BrowserPolicySnapshot | typeof INVALID_BROWSER_POLICY | undefined {
  if (input === undefined) return;

  const source = snapshotRecord(input, POLICY_KEYS, POLICY_KEYS);
  if (!source || source.kind !== 'verified-loopback') return INVALID_BROWSER_POLICY;

  const dedicatedWorkers = snapshotDedicatedWorkers(source.dedicatedWorkers, maxSources);
  const serviceWorker = snapshotServiceWorker(source.serviceWorker);
  if (!dedicatedWorkers || !serviceWorker) return INVALID_BROWSER_POLICY;

  return Object.freeze({
    kind: 'verified-loopback',
    dedicatedWorkers,
    serviceWorker,
  });
}

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

/** Admit Fetch Metadata values accepted by the verified-loopback browser policy. */
export function acceptsFetchSite(request: Request): boolean {
  const value = request.headers.get('sec-fetch-site');
  if (value === null) return true;
  return value === 'same-origin' || value === 'same-site' || value === 'none';
}

/** Admit observed worker destinations independently from ordinary asset routing. */
export function acceptsWorkerDestination(
  request: Request,
  path: t.Files.String.Path | undefined,
  policy: BrowserPolicySnapshot,
  directWorkerAssets: readonly t.Files.String.Path[],
): boolean {
  const value = request.headers.get('sec-fetch-dest');
  if (value === null) return true;
  const destination = value.trim().toLowerCase();

  if (destination === 'worker') {
    return path !== undefined &&
      directWorkerAssets.includes(path) &&
      isExactAssetRequest(request, path);
  }
  if (destination === 'sharedworker') return false;
  if (destination === 'serviceworker') {
    const serviceWorker = policy.serviceWorker;
    return serviceWorker.kind === 'tombstone' &&
      path === serviceWorker.path &&
      isExactAssetRequest(request, path);
  }

  // Malformed worker-like metadata never weakens a recognized worker decision.
  return !destination.includes('worker');
}

/** Apply the fixed browser policy to one success or error response. */
export function applyBrowserHeaders(
  response: Response,
  policy: t.DistServer.BrowserPolicy.Headers,
): Response {
  const headers = new Headers(response.headers);
  for (const name of [...headers.keys()]) {
    if (name.toLowerCase().startsWith('access-control-')) headers.delete(name);
  }
  headers.delete('set-cookie');
  headers.set('cache-control', policy.cacheControl);
  headers.set('content-security-policy', policy.contentSecurityPolicy);
  headers.set('cross-origin-opener-policy', policy.crossOriginOpenerPolicy);
  headers.set('cross-origin-resource-policy', policy.crossOriginResourcePolicy);
  headers.set('referrer-policy', policy.referrerPolicy);
  headers.set('x-content-type-options', policy.xContentTypeOptions);
  headers.set('x-frame-options', policy.xFrameOptions);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/** Emit one bodyless policy rejection with the complete fixed response policy. */
export function browserRejected(
  status: number,
  policy: t.DistServer.BrowserPolicy.Headers,
): Response {
  return applyBrowserHeaders(new Response(null, { status }), policy);
}

function snapshotDedicatedWorkers(
  input: unknown,
  maxSources: number,
): readonly t.DistServer.BrowserPolicy.DedicatedWorker.Source[] | undefined {
  if (!Is.array(input) || Object.getPrototypeOf(input) !== Array.prototype) return;
  if (!Num.Is.safeInt(maxSources) || maxSources < 0) return;

  const length = input.length;
  if (!Num.Is.safeInt(length) || length > maxSources) return;
  const keys = Reflect.ownKeys(input);
  if (keys.length !== length + 1 || !keys.includes('length')) return;
  const lengthDescriptor = Object.getOwnPropertyDescriptor(input, 'length');
  if (!lengthDescriptor || !Obj.hasOwn(lengthDescriptor, 'value')) return;

  const output: t.DistServer.BrowserPolicy.DedicatedWorker.Source[] = [];
  const assets = new Set<string>();
  const blobs = new Set<string>();
  for (let index = 0; index < length; index++) {
    const key = String(index);
    if (!keys.includes(key)) return;
    const descriptor = Object.getOwnPropertyDescriptor(input, key);
    if (!descriptor || !Obj.hasOwn(descriptor, 'value')) return;

    const source = snapshotDedicatedWorkerSource(descriptor.value);
    if (!source) return;
    if (source.kind === 'blob') {
      if (blobs.has(source.worker)) return;
      blobs.add(source.worker);
    } else {
      if (assets.has(source.path)) return;
      assets.add(source.path);
    }
    output.push(source);
  }
  return Object.freeze(output);
}

function snapshotDedicatedWorkerSource(
  input: unknown,
): t.DistServer.BrowserPolicy.DedicatedWorker.Source | undefined {
  const source = snapshotRecord(input, SOURCE_KEYS, ['kind']);
  if (!source) return;
  if (source.kind === 'blob') {
    if (!canonicalAssetPath(source.worker) || Reflect.ownKeys(source).length !== 2) return;
    return Object.freeze({ kind: 'blob', worker: source.worker });
  }
  if (source.kind !== 'asset' || !canonicalAssetPath(source.path)) return;
  if (Reflect.ownKeys(source).length !== 2) return;
  return Object.freeze({ kind: 'asset', path: source.path });
}

function snapshotServiceWorker(
  input: unknown,
): t.DistServer.BrowserPolicy.ServiceWorker.Admission | undefined {
  const source = snapshotRecord(input, SERVICE_WORKER_KEYS, ['kind']);
  if (!source) return;
  if (source.kind === 'deny') {
    if (Reflect.ownKeys(source).length !== 1) return;
    return Object.freeze({ kind: 'deny' });
  }
  if (source.kind !== 'tombstone' || !canonicalAssetPath(source.path)) return;
  if (Reflect.ownKeys(source).length !== 2) return;
  return Object.freeze({ kind: 'tombstone', path: source.path });
}

function canonicalAssetPath(input: unknown): input is t.Files.String.Path {
  if (!Is.str(input) || input.length === 0 || input.includes('\\') || input.includes('\0')) {
    return false;
  }
  const segments = input.split('/');
  return segments.every((segment) => segment.length > 0 && segment !== '.' && segment !== '..');
}

function isJavaScript(path: t.Files.String.Path): boolean {
  return MediaType.fromPath(path) === 'text/javascript';
}

function isExactAssetRequest(request: Request, path: t.Files.String.Path): boolean {
  try {
    const url = new URL(request.url);
    return !url.href.includes('?') && url.pathname === assetPathname(path);
  } catch {
    return false;
  }
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

function assetUrl(origin: t.StringUrl, path: t.Files.String.Path): string {
  return new URL(assetPathname(path), `${origin}/`).href;
}

function assetPathname(path: t.Files.String.Path): string {
  const encoded = path.split('/').map((segment) => encodeURIComponent(segment)).join('/');
  return `/${encoded}`;
}
