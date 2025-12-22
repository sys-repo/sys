import type { t } from '../common.ts';

/**
 * No-op provider configuration.
 *
 * This provider intentionally performs no deployment.
 * It exists to:
 * - validate multi-provider plumbing
 * - exercise schema discrimination
 * - act as a stable inert endpoint target
 *
 * It is a first-class provider, not a test mock.
 */
export type NoopProvider = {
  kind: 'noop';
};
