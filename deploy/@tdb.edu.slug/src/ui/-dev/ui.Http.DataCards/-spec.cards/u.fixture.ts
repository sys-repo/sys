import type { t } from './common.ts';

/** Bounded Slug transport shared by HTTP Data-card specs. */
export function slugTransport(origin: t.StringUrl): t.SlugLoadTransport {
  return {
    policy: {
      maxBytes: 64 * 1024 * 1024,
      timeout: 30_000,
      maxRedirects: 3,
      progressInterval: 100,
      sourceOrigins: [new URL(origin).origin],
      credentialOrigins: [],
    },
  };
}
