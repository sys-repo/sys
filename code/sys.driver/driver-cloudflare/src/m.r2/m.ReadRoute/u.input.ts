import { Is, Num, Obj, type t } from './common.ts';
import { toPresignKey } from '../m.Service/u.presign.ts';

/** Capture configuration before accepting requests. */
export function snapshot(options: t.R2.ReadRoute.CreateOptions): t.RouteConfig {
  const bucket = options.bucket;
  const presignGet = bucket?.presignGet;
  if (!Is.func(presignGet)) throw new Error('R2 read routes require presigned GET support.');
  const bucketName = toPresignKey(bucket.name);
  if (bucketName.includes('/')) throw new Error('R2 read route bucket name must be one segment.');

  const storageOrigin = options.storageOrigin;
  if (!/^https:\/\/[a-f0-9]{32}\.r2\.cloudflarestorage\.com$/.test(storageOrigin)) {
    throw new Error('R2 read routes require an exact R2 S3 storage origin.');
  }
  const authorize = options.authorize;
  if (!Is.func(authorize)) throw new Error('R2 read routes require an authorization callback.');
  if (!Is.record(options.routes)) throw new Error('R2 read routes require a route map.');
  const routes = new Map<string, string>();
  for (const [path, key] of Obj.entries(options.routes)) {
    if (!isRoutePath(path)) throw new Error('R2 read route path is not canonical.');
    routes.set(path, toPresignKey(key));
  }

  const { maxBytes, timeout, maxConcurrent } = options.limits ?? {};
  if (![maxBytes, timeout, maxConcurrent].every((value) => Num.Is.safeInt(value) && value > 0)) {
    throw new Error('R2 read route limits must be positive safe integers.');
  }
  if (timeout > 604_800_000) throw new Error('R2 read route timeout exceeds seven days.');
  const limits = Object.freeze({ maxBytes, timeout, maxConcurrent });
  // The URL stays server-side. Its lifetime is the request budget rounded up to whole seconds.
  const expirySeconds = Math.ceil(timeout / 1000);
  const sign = (key: string) => presignGet.call(bucket, key, { expirySeconds });
  return { bucketName, storageOrigin, routes, limits, authorize, sign };
}

/** Accept one spelling per observable URL path; never decode it into an object key. */
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
export function signedUrl(config: t.RouteConfig, key: string, input: string): string {
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
