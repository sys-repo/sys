import { Is, Num, Obj, type t } from '../common.ts';
import type { RouteConfig, RouteSource } from '../t.internal.ts';
import { toPresignKey } from '../../m.Service/u.presign.ts';

/** Capture configuration before accepting requests. */
export function snapshot(options: t.R2.ReadRoute.CreateOptions): RouteConfig {
  const source = snapshotSource(options);
  const authorize = options.authorize;
  if (!Is.func(authorize)) throw new Error('R2 read routes require an authorization callback.');
  if (!Is.record(options.routes)) throw new Error('R2 read routes require a route map.');
  const routes = new Map<string, string>();
  for (const [path, key] of Obj.entries(options.routes)) {
    if (!isRoutePath(path)) throw new Error('R2 read route path is not canonical.');
    routes.set(path, toPresignKey(key));
  }
  const limits = snapshotLimits(options.limits);
  return { ...source, routes, limits, authorize };
}

/** Capture the receiver and signer once; every use still checks the exact signed target. */
export function snapshotSource(
  options: Pick<t.R2.ReadRoute.CreateOptions, 'bucket' | 'storageOrigin'>,
): RouteSource {
  const bucket = options.bucket;
  const presignGet = bucket?.presignGet;
  if (!Is.func(presignGet)) throw new Error('R2 read routes require presigned GET support.');
  const bucketName = toPresignKey(bucket.name);
  if (bucketName.includes('/')) throw new Error('R2 read route bucket name must be one segment.');

  const storageOrigin = options.storageOrigin;
  if (!/^https:\/\/[a-f0-9]{32}\.r2\.cloudflarestorage\.com$/.test(storageOrigin)) {
    throw new Error('R2 read routes require an exact R2 S3 storage origin.');
  }
  // The URL remains server-side; expiry is the read budget rounded up to whole seconds.
  const sign = (key: string, timeout: number) =>
    presignGet.call(bucket, key, { expirySeconds: Math.ceil(timeout / 1000) });
  return Object.freeze({ bucketName, storageOrigin, sign });
}

/** Validate and copy the byte, timeout, and concurrency limits. */
export function snapshotLimits(input: t.R2.ReadRoute.Limits): Readonly<t.R2.ReadRoute.Limits> {
  const { maxBytes, timeout, maxConcurrent } = input ?? {};
  if (![maxBytes, timeout, maxConcurrent].every((value) => Num.Is.safeInt(value) && value > 0)) {
    throw new Error('R2 read route limits must be positive safe integers.');
  }
  if (timeout > 604_800_000) throw new Error('R2 read route timeout exceeds seven days.');
  return Object.freeze({ maxBytes, timeout, maxConcurrent });
}

/** Accept only canonical encoded URL paths; storage keys come from the route map. */
export function isRoutePath(path: string): boolean {
  if (path === '/') return true;
  // One leading slash plus at most three URL characters per admitted UTF-8 byte.
  if (!path.startsWith('/') || path.length > 1 + 3 * 1024) return false;
  try {
    const segments = path.slice(1).split('/').map(decodeURIComponent);
    if (segments.some((segment) => segment.includes('/'))) return false;
    toPresignKey(segments.join('/'));
    return segments.map(encodeURIComponent).join('/') === path.slice(1);
  } catch {
    return false;
  }
}

/** Refuse a signer result that changes the configured storage target. */
export function signedUrl(config: RouteSource, key: string, input: string): string {
  const url = new URL(input);
  const path = key.split('/').map(encodeURIComponent).join('/');
  const expectedPath = `/${encodeURIComponent(config.bucketName)}/${path}`;
  if (
    url.origin !== config.storageOrigin || url.pathname !== expectedPath ||
    url.username || url.password || url.hash
  ) {
    throw new Error('R2 read route signer changed the storage target.');
  }
  return url.href;
}
