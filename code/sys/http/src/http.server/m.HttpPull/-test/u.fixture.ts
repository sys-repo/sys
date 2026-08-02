import type { t } from '../../../-test.ts';

/** Create explicit bounded transport options for legacy Pull tests. */
export function options(
  urls: readonly t.StringUrl[],
  input: Omit<t.HttpPull.Options, 'client' | 'policy'> = {},
): t.HttpPull.Options {
  return { ...input, policy: responsePolicy(urls) };
}

/** Create explicit owned transport options for secure resource tests. */
export function resourceOptions(
  resources: readonly t.HttpPull.Resource[],
  input: Pick<t.HttpPull.ResourceOptions, 'until'> = {},
): t.HttpPull.ResourceOptions {
  return {
    ...input,
    policy: responsePolicy(resources.map((resource) => resource.source)),
  };
}

export function responsePolicy(urls: readonly t.StringUrl[]): t.HttpFetch.ResponsePolicy {
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
    maxBytes: 1024 * 1024,
    timeout: 1000,
    maxRedirects: 2,
    progressInterval: 25,
    sourceOrigins,
    credentialOrigins: [],
  };
}
