import type { t } from '../../../-test.ts';

/** Create one explicit bounded response policy for tests. */
export function responsePolicy(
  sourceOrigins: readonly t.StringUrl[],
  overrides: Partial<t.HttpFetch.ResponsePolicy> = {},
): t.HttpFetch.ResponsePolicy {
  return {
    maxBytes: 1024,
    timeout: 1000,
    maxRedirects: 2,
    progressInterval: 25,
    sourceOrigins,
    credentialOrigins: [],
    ...overrides,
  };
}

/** Create one bounded Fetch capability configuration for tests. */
export function fetchOptions(
  sourceOrigins: readonly t.StringUrl[],
  policyOverrides: Partial<t.HttpFetch.ResponsePolicy> = {},
  options: Omit<t.HttpFetch.CreateOptions, 'policy'> = {},
): t.HttpFetch.CreateOptions {
  return {
    ...options,
    policy: responsePolicy(sourceOrigins, policyOverrides),
  };
}
