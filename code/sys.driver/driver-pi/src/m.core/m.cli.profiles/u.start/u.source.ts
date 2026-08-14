import { Is, Shard, type t, Url } from '../common.ts';
import type { Dist } from '@sys/server/dist';
import { LIMITS } from './u.limits.ts';

export { LIMITS } from './u.limits.ts';

export type ManifestSource = Readonly<{
  href: t.StringUrl;
  origin: t.StringUrl;
}>;

export function materializePolicy(
  source: ManifestSource,
): Parameters<typeof Dist.materialize>[0]['policy'] {
  const response = {
    maxBytes: 128 * 1024 * 1024,
    timeout: 60_000,
    maxRedirects: 3,
    progressInterval: 100,
    sourceOrigins: [source.origin],
    credentialOrigins: [] as readonly t.StringUrl[],
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

export function resolveIntegrity(input: t.StringHash): t.StringHash {
  if (!Is.string(input) || !input.startsWith('sha256-')) {
    throw new Error('Invalid start:gui manifest integrity.');
  }

  try {
    const hex = Shard.Sha256.normalizeHex(input);
    if (hex !== input.slice('sha256-'.length)) {
      throw new Error('Invalid start:gui manifest integrity.');
    }
  } catch {
    throw new Error('Invalid start:gui manifest integrity.');
  }

  return input;
}

export function resolveManifestSource(input: t.StringUrl): ManifestSource {
  if (!Is.urlString(input)) throw new Error('Invalid start:gui manifest URL.');

  const parsed = Url.parse(input);
  if (!parsed.ok) throw new Error('Invalid start:gui manifest URL.');

  const url = parsed.toURL();
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Invalid start:gui manifest URL.');
  }
  url.hash = '';
  return {
    href: url.href as t.StringUrl,
    origin: url.origin as t.StringUrl,
  };
}
