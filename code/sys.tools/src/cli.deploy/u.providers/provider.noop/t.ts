import type { t } from '../common.ts';

/**
 * Explicitly inert provider configuration.
 *
 * Noop validates as a provider but resolves no publication target.
 */
export type NoopProvider = {
  kind: 'noop';
};
