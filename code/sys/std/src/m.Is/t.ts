import type { t } from '../common.ts';

type O = Record<string, unknown>;

/**
 * Boolean type guard evaluators.
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
   * Determine if the input is an object implementing the `Disposable` interface.
   */
  disposable(input?: unknown): input is t.Disposable;

  /**
   * Determine if the input is an object implementing the `DisposableLike` interface.
   */
  disposableLike(input?: unknown): input is t.DisposableLike;

  /**
   * Determine if the value is a Promise or thenable.
   */
  promise<T = unknown>(input?: unknown): input is PromiseLike<T>;

  /**
   * Determine if the value is an observable Subject.
   */
  subject<T = unknown>(input?: any): input is t.Subject<T>;

  /**
   * Determine if the value is an Observable.
   */
  observable<T = unknown>(input?: any): input is t.Observable<T>;

  /**
   * Determine if the given value is an Error instance.
   */
  error: t.ErrIsLib['error'];
  /**
   * Determine if the value is like an Error object.
   */
  errorLike: t.ErrIsLib['errorLike'];

  /**
   * Determine if the given value conforms to the [StdError] type.
   */
  stdError: t.ErrIsLib['stdError'];

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

  /** True if the input or any nested `cause` carries the given HTTP status code. */
  httpStatus(input: unknown, status: t.HttpStatusCode): boolean;

  /**
   * True if running inside *any* browser JS runtime:
   * window, iframe, or any Web Worker.
   */
  browser(): boolean;

  /**
   * True if running inside a Web Worker (Dedicated/Shared/Service).
   */
  worker(): boolean;

  /** Determine if the given input is typeof {object} and not Null. */
  object(input?: unknown): input is object;
  /** Determine if the given input is a simple {key:value} record object. */
  record<T extends O>(input?: unknown): input is T;
  /** Determine if the given object is empty of all fields. */
  emptyRecord<T extends O>(input?: unknown): input is T;

  /**
   * Test whether a value is a *plain* object.
   * - Excludes arrays, functions, class instances, Dates, etc.
   * - Prototype must be exactly `Object.prototype` or `null`.
   * - Cross-realm safe (`Object.prototype.toString` check).
   */
  plainObject(input?: unknown): input is Record<PropertyKey, unknown>;

  /**
   * Test whether a value is a *plain record* (null-prototype object).
   * - Excludes arrays, functions, class instances, Dates, etc.
   * - Prototype must be exactly `null`.
   * - Useful for dictionary / map-like objects that avoid prototype pollution.
   */
  plainRecord(input?: unknown): input is Record<PropertyKey, unknown>;

  /**
   * Determine if the value is a function.
   * typeof === 'function'
   */
  func(input?: unknown): input is Function;

  /**
   * Determine if the value is a boolean.
   * typeof === 'boolean'
   */
  bool(input?: unknown): input is boolean;

  /**
   * Determine if the value is a string.
   * typeof === 'string'
   */
  string(input?: unknown): input is string;
  str(input?: unknown): input is string;

  /**
   * Determine if the value is a number.
   * typeof === 'number'
   */
  number(input?: unknown): input is number;
  num(input?: unknown): input is number;

  /**
   * Determine if the value is an array.
   */
  array<T>(input?: unknown): input is T[];

  /**
   * Determine if the given value (or the browser is environment) is "localhost".
   */
  localhost(value?: string | Location): boolean;

  /**
   * Determine if the given value is an ['object', 'path'] array.
   */
  objectPath(input?: unknown): input is t.ObjectPath;

  /**
   * Determine if the given value is an `AbortSignal`.
   */
  abortSignal(input?: unknown): input is AbortSignal;

  /**
   * Determine if the given value is an `AbortController`.
   */
  abortController(input?: unknown): input is AbortController;

  /**
   * Determine if the value conforms to an `Until`:
   */
  until(input?: unknown): input is t.Until;

  /**
   * Determine if the value conforms to an `UntilInput` API parameter.
   */
  untilInput(input?: unknown): input is t.UntilInput;

  /**
   * True if the value structurally matches a WebSocket.
   */
  websocket(input?: unknown): input is WebSocket;

  /**
   * Determine if the given value is structurally URL-like.
   *
   * Matches:
   *  - `URL` instances
   *  - any `{ href: string }`
   *  - any `{ toURL(): URL }`
   */
  urlLike(input?: unknown): input is t.UrlLike;

  /**
   * True if the input is a valid http/https URL string.
   *
   * Only absolute http/https URLs are treated as URL strings;
   * everything else (relative, malformed, non-string) returns false.
   */
  urlString(input: unknown): input is t.StringUrl;
};
