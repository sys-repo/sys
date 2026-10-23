import type { t } from './common.ts';
import { admit } from './u/u.admit.ts';
import { register } from './u/u.register.ts';
import { tombstone } from './u/u.tombstone.ts';

/**
 * Fail-closed service-worker deployment admission and migration helpers.
 */
export const ServiceWorker: t.HttpServiceWorker.Lib = Object.freeze({
  admit,
  register,
  tombstone,
});
