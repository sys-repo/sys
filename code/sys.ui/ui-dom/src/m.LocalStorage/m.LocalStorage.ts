import { type t } from '../common.ts';
import { immutable } from './u.immutable.ts';
import { ns } from './u.namespace.ts';

/**
 * Helpers for working with a strongly typed local-storage object.
 */
export const LocalStorage: t.LocalStorageLib = {
  ns,
  immutable,
};
