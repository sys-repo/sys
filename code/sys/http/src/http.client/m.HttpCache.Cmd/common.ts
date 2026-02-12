export * from '../common.ts';

/**
 * Canonical command constants for HTTP cache command routing.
 */
export const D = {
  NS: 'http.cache',
  CONNECT: 'http.cache.cmd.connect',
  CLEAR: 'http.cache.clear',
} as const;
