import type { t } from './common.ts';

/** Bounded Slug transport policy shared by Data-card specs. */
export function responsePolicy(origin: t.StringUrl): t.HttpFetch.ResponsePolicy {
  return {
    maxBytes: 64 * 1024 * 1024,
    timeout: 30_000,
    maxRedirects: 3,
    progressInterval: 100,
    sourceOrigins: [new URL(origin).origin],
    credentialOrigins: [],
  };
}
