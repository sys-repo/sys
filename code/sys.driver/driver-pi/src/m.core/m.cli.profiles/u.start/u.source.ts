import { Is, type t, Url } from '../common.ts';
import type { Dist } from '@sys/server/dist';

export const LIMITS = {
  manifestBytes: 16 * 1024 * 1024, //   ← 16 MB
  entries: 4096 * 2 + 1, //             ← 8,193 entries
  fileBytes: 128 * 1024 * 1024, //      ← 128 MB
  totalBytes: 1024 * 1024 * 1024, //    ← 1,024 MB (1 GB)
} as const;

/** Canonical launcher-owned source for the verified local UI runtime. */
export const START_UI_SOURCE = Object.freeze({
  manifestUrl: 'http://localhost:8080/dist.json' as t.StringUrl,
  integrity:
    'sha256-07d24ba144edb1f84eb2db14b10fcd3c3470775ee389b518c0ae9a9b5b2ddfbc' as t.StringHash,
});

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

export function resolveManifestSource(input: t.StringUrl): ManifestSource {
  if (!Is.urlString(input)) throw new Error('Invalid start:ui manifest URL.');

  const parsed = Url.parse(input);
  if (!parsed.ok) throw new Error('Invalid start:ui manifest URL.');

  const url = parsed.toURL();
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Invalid start:ui manifest URL.');
  }
  url.hash = '';
  return {
    href: url.href as t.StringUrl,
    origin: url.origin as t.StringUrl,
  };
}
