import type { LocalStorageLib } from './t.ts';

import { immutable } from './u.immutable.ts';
import { ns } from './u.namespace.ts';

/**
 * Helpers for working with a strongly typed local-storage object.
 */
export const LocalStorage: LocalStorageLib = {
  ns,
  immutable,
};
