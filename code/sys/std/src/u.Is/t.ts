import type { t } from '../common.ts';

/**
 * Type guards (boolean evaluators).
 */
export type CommonIsLib = {
  promise<T = any>(value?: any): value is Promise<T>;
  subject: t.RxIs['subject'];
  observable: t.RxIs['observable'];
  errorLike: t.ErrorLib['isErrorLike'];
};
