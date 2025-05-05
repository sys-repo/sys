import type { t } from '../common.ts';

type O = Record<string, unknown>;

/**
 * Type guards (boolean evaluators).
 */
export type StdIsLib = {
  /**
   * Falsy check.
   * https://developer.mozilla.org/en-US/docs/Glossary/Falsy
   */
  falsy(input?: unknown): input is t.Falsy | typeof NaN;

  /**
   * Determine if the input is nill (undefined or null).
   */
  nil(input?: unknown): input is null | undefined;

  /**
   * Determine if the input is an object implementing the <t.Disposable> interface.
   */
  disposable(input?: unknown): input is t.Disposable;

  /**
   * Determine if the value is a Promise.
   */
  promise<T = any>(input?: unknown): input is Promise<T>;

  /**
   * Determine if the value is an observable Subject.
   */
  subject<T = unknown>(input?: any): input is t.Subject<T>;

  /**
   * Determine if the value is an Observable.
   */
  observable<T = unknown>(input?: any): input is t.Observable<T>;

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
   * Determine if the input is [ArrayBufferLike].
   */
  arrayBufferLike(input?: unknown): input is ArrayBufferLike;

  /**
   * Determine if the inut is a [Uint8Array].
   */
  uint8Array(input?: unknown): input is Uint8Array;

  /**
   * A safe way to test any value as to wheather is is 'blank'
   * meaning it can be either:
   *   - null
   *   - undefined
   *   - empty-string ('')
   *   - empty-array ([]).
   */
  blank(value?: unknown): boolean;

  /** Determine if the given value is a `NetAddr`. */
  netaddr(input: unknown): input is Deno.NetAddr;

  /** Determine if the HTTP status code is within the 200 range.  */
  statusOK(status: number): boolean;

  /** Determines if currently running within a browser environment. */
  browser(): boolean;

  /** Determine if the value is a function */
  func(input?: unknown): input is Function;

  /** Determine if the given input is typeof {object} and not Null. */
  object(input?: unknown): input is object;
  /** Determine if the given input is a simple {key:value} record object. */
  record<T extends O>(input?: unknown): input is T;
  /** Determine if the given object is empty of all fields. */
  emptyRecord<T extends O>(input?: unknown): input is T;
};
