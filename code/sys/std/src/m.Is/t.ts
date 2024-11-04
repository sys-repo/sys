import type { t } from '../common.ts';

/**
 * Type guards (boolean evaluators).
 */
export type CommonIsLib = {
  /**
   * Falsy check.
   * https://developer.mozilla.org/en-US/docs/Glossary/Falsy
   */
  falsy(input?: unknown): input is t.Falsy | typeof NaN;

  /**
   * Determine if the value is a Promise.
   */
  promise<T = any>(input?: unknown): input is Promise<T>;

  /**
   * Determine if the value is an observable Subject.
   */
  subject: t.RxIs['subject'];

  /**
   * Determine if the value is an Observable.
   */
  observable: t.RxIs['observable'];

  /**
   * Determine if the value is like an Error object.
   */
  errorLike: t.ErrIs['errorLike'];

  /**
   * Determine if the given value conforms to the [StdError] type.
   */
  stdError: t.ErrIs['stdError'];

  /**
   * Determine if the value is a number.
   */
  numeric(input?: unknown): boolean;

  /**
   * Determine if the input is a JSON structure.
   */
  json(input?: unknown): input is t.Json;

  /**
   * Determine if the input is ArrayBufferLike.
   */
  arrayBufferLike(input?: unknown): input is ArrayBufferLike;

  /**
   * A safe way to test any value as to wheather is is 'blank'
   * meaning it can be either:
   *   - null
   *   - undefined
   *   - empty-string ('')
   *   - empty-array ([]).
   */
  blank(value?: any): boolean;
};
