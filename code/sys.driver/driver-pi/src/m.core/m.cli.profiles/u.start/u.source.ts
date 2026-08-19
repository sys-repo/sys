import { Is, StartGuiIntrinsic, type t } from './common.ts';
import { AUTHORITY_LIMITS, LIMITS } from './u.limits.ts';
import { captureUrl } from './u.url.ts';

export type ManifestSource = Readonly<{
  href: t.StringUrl;
  origin: t.StringUrl;
}>;

const NativeError = Error;
const SHA256_PREFIX = 'sha256-';

export function materializePolicy(source: ManifestSource): t.Dist.Policy {
  const response = {
    maxBytes: 128 * 1024 * 1024,
    timeout: 60_000,
    maxRedirects: 3,
    progressInterval: 100,
    sourceOrigins: [source.origin],
    credentialOrigins: [],
  } as const;

  return {
    manifest: {
      ...response,
      maxBytes: 16 * 1024 * 1024,
      timeout: 30_000,
    },
    resources: {
      response,
      maxResources: 4096,
      concurrency: 4,
      maxAttempts: 4,
      retryDelay: 250,
      maxRetryElapsed: 2 * 60_000,
      maxTotalBytes: 1024 * 1024 * 1024,
      totalTimeout: 10 * 60_000,
    },
    verification: LIMITS,
  };
}

export function resolveIntegrity(input: unknown): t.StringHash {
  if (!Is.string(input) || !isSha256Integrity(input)) {
    throw new NativeError('Invalid start:gui manifest integrity.');
  }
  return input;
}

export function resolveManifestSource(input: unknown): ManifestSource {
  if (
    !Is.string(input) || input.length > AUTHORITY_LIMITS.manifestUrl || hasControl(input)
  ) {
    throw new NativeError('Invalid start:gui manifest URL.');
  }

  const url = captureUrl(input);
  if (!url) throw new NativeError('Invalid start:gui manifest URL.');

  const href = url.href;
  if (
    (url.protocol !== 'http:' && url.protocol !== 'https:') ||
    hasUserinfo(input) || url.username || url.password || url.search || url.hash ||
    StartGuiIntrinsic.stringIncludes(input, '?') ||
    StartGuiIntrinsic.stringIncludes(input, '#') || href.length > AUTHORITY_LIMITS.manifestUrl
  ) {
    throw new NativeError('Invalid start:gui manifest URL.');
  }
  return { href, origin: url.origin };
}

function isSha256Integrity(input: string): boolean {
  if (
    input.length !== AUTHORITY_LIMITS.integrity ||
    StartGuiIntrinsic.stringSlice(input, 0, SHA256_PREFIX.length) !== SHA256_PREFIX
  ) return false;

  for (let index = SHA256_PREFIX.length; index < input.length; index += 1) {
    const code = StartGuiIntrinsic.stringCharCodeAt(input, index);
    const digit = code >= 0x30 && code <= 0x39;
    const lowerHex = code >= 0x61 && code <= 0x66;
    if (!digit && !lowerHex) return false;
  }
  return true;
}

function hasControl(input: string): boolean {
  for (let index = 0; index < input.length; index += 1) {
    const code = StartGuiIntrinsic.stringCharCodeAt(input, index);
    if (code <= 0x1f || code === 0x7f) return true;
  }
  return false;
}

function hasUserinfo(input: string): boolean {
  const scheme = StartGuiIntrinsic.stringIndexOf(input, '://');
  if (scheme < 0) return false;
  const remainder = StartGuiIntrinsic.stringSlice(input, scheme + 3);
  const slash = StartGuiIntrinsic.stringIndexOf(remainder, '/');
  const authority = slash < 0 ? remainder : StartGuiIntrinsic.stringSlice(remainder, 0, slash);
  return StartGuiIntrinsic.stringIncludes(authority, '@');
}
