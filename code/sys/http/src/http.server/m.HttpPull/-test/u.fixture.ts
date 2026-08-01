import type { t } from '../../../-test.ts';

/** Create explicit bounded transport options for Pull tests. */
export function options(
  urls: readonly t.StringUrl[],
  input: Omit<t.HttpPull.Options, 'client' | 'policy'> = {},
): t.HttpPull.Options {
  const parsed = urls.flatMap((url) => {
    try {
      return [new URL(url).origin];
    } catch {
      return [];
    }
  });
  const sourceOrigins = [...new Set(parsed)];
  if (sourceOrigins.length === 0) sourceOrigins.push('https://example.test');
  return {
    ...input,
    policy: {
      maxBytes: 1024 * 1024,
      timeout: 1000,
      maxRedirects: 2,
      progressInterval: 25,
      sourceOrigins,
      credentialOrigins: [],
    },
  };
}
