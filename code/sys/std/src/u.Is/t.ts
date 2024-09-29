import type { t } from '../common.ts';

/**
 * Type guards (boolean evaluators).
 */
export type CommonIsLib = {
  subject: t.RxIs['subject'];
  observable: t.RxIs['observable'];
  promise<T = any>(value?: any): value is Promise<T>;
};
