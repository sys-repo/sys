import { Is, type t } from './common.ts';
import { AUTHORITY_LIMITS, LIMITS } from './u.limits.ts';
import { captureUrl } from './u.url.ts';

export type ManifestSource = Readonly<{
  href: t.StringUrl;
  origin: t.StringUrl;
}>;

const SHA256_PREFIX = 'sha256-';

export function materializePolicy(source: ManifestSource): t.Dist.Policy {
  const response = Object.freeze({
    maxBytes: 128 * 1024 * 1024,
    timeout: 60_000,
    maxRedirects: 3,
    progressInterval: 100,
    sourceOrigins: Object.freeze([source.origin]),
    credentialOrigins: Object.freeze([]),
  });
  return Object.freeze({
    manifest: Object.freeze({ ...response, maxBytes: 16 * 1024 * 1024, timeout: 30_000 }),
    resources: Object.freeze({
      response,
      maxResources: 4096,
      concurrency: 4,
      maxAttempts: 4,
      retryDelay: 250,
      maxRetryElapsed: 2 * 60_000,
      maxTotalBytes: 1024 * 1024 * 1024,
      totalTimeout: 10 * 60_000,
    }),
    verification: LIMITS,
  });
}

export function resolveIntegrity(input: unknown): t.StringHash {
  if (!Is.string(input) || !isSha256Integrity(input)) {
    throw new Error('Invalid start:gui manifest integrity.');
  }
  return input;
}

export function resolveManifestSource(input: unknown): ManifestSource {
  if (!Is.string(input) || input.length > AUTHORITY_LIMITS.manifestUrl || hasControl(input)) {
    throw new Error('Invalid start:gui manifest URL.');
  }
  const url = captureUrl(input);
  if (
    !url || (url.protocol !== 'http:' && url.protocol !== 'https:') ||
    hasUserinfo(input) || url.username || url.password || url.search || url.hash ||
    input.includes('?') || input.includes('#') || url.href.length > AUTHORITY_LIMITS.manifestUrl
  ) throw new Error('Invalid start:gui manifest URL.');
  return Object.freeze({ href: url.href, origin: url.origin });
}

function isSha256Integrity(input: string): boolean {
  if (input.length !== AUTHORITY_LIMITS.integrity || !input.startsWith(SHA256_PREFIX)) return false;
  for (let index = SHA256_PREFIX.length; index < input.length; index += 1) {
    const code = input.charCodeAt(index);
    if (!((code >= 0x30 && code <= 0x39) || (code >= 0x61 && code <= 0x66))) return false;
  }
  return true;
}

function hasControl(input: string): boolean {
  for (let index = 0; index < input.length; index += 1) {
    const code = input.charCodeAt(index);
    if (code <= 0x1f || code === 0x7f) return true;
  }
  return false;
}

function hasUserinfo(input: string): boolean {
  const scheme = input.indexOf('://');
  if (scheme < 0) return false;
  const remainder = input.slice(scheme + 3);
  const slash = remainder.indexOf('/');
  return (slash < 0 ? remainder : remainder.slice(0, slash)).includes('@');
}
