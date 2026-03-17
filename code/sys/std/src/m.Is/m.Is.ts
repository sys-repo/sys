import type { StdIsLib } from './t.ts';

import {
  type t,
  isEmptyRecord,
  isObject,
  isPlainObject,
  isPlainRecord,
  isPromise,
  isRecord,
} from '../common.ts';
import { Err } from '../m.Err/mod.ts';
import { number, numeric } from './u.number.ts';
import { string } from './u.string.ts';
import { urlLike, urlString } from './u.url.ts';
import { websocket } from './u.websocket.ts';
import { browser } from './u.browser.ts';

/**
 * Common flag evaluators.
 */
export const Is: StdIsLib = {
  get error() {
    return Err.Is.error;
  },
  get errorLike() {
    return Err.Is.errorLike;
  },
  get stdError() {
    return Err.Is.stdError;
  },

  object: isObject,
  record: isRecord,
  emptyRecord: isEmptyRecord,
  plainObject: isPlainObject,
  plainRecord: isPlainRecord,
  promise: isPromise,

  numeric,
  number,
  num: number,
  string,
  str: string,
  urlLike,
  urlString,
  websocket,
  browser,

  disposable(input?: any): input is t.Disposable {
    if (!isObject(input)) return false;
    const obj = input as t.Disposable;
    return typeof obj.dispose === 'function' && Is.observable(obj.dispose$);
  },
  disposableLike(input?: any): input is t.DisposableLike {
    if (!isObject(input)) return false;
    return typeof (input as t.DisposableLike).dispose === 'function';
  },

  /**
   * Determine if the given input is an Observable.
   */
  observable<T = unknown>(input?: any): input is t.Observable<T> {
    return typeof input === 'object' && typeof input?.subscribe === 'function';
  },

  /**
   * Determine if the given input is an observable Subject.
   */
  subject<T = unknown>(input?: any): input is t.Subject<T> {
    return Is.observable(input) && typeof (input as any)?.next === 'function';
  },

  /**
   * Determine if the value is "falsey".
   * https://developer.mozilla.org/en-US/docs/Glossary/Falsy
   */
  falsy(input?: any): input is t.Falsy {
    return (
      input === false ||
      input === 0 ||
      input === '' ||
      input === null ||
      input === undefined ||
      input === 0n ||
      Number.isNaN(input) // Handle NaN at runtime.
    );
  },

  /** Determine if the value is <null> or <undefined>. */
  nil(input?: any): input is null | undefined {
    return input == null;
  },

  /**
   * A safe way to test any value as to wheather is is 'blank'
   * meaning it can be either:
   *   - null
   *   - undefined
   *   - empty-string ('')
   *   - empty-array ([]).
   */
  blank(value?: any) {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string' && value.trim() === '') return true;
    if (Array.isArray(value) && value.filter((v) => !Is.blank(v)).length === 0) return true;
    return false;
  },

  bool(input?: any): input is boolean {
    return typeof input === 'boolean';
  },

  func(input?: any): input is Function {
    return typeof input === 'function';
  },

  array<T>(input?: any): input is T[] {
    return Array.isArray(input);
  },

  json(input?: any): input is t.Json {
    if (typeof input !== 'string') return false;
    input = input.trim();
    return input.startsWith('{') || input.startsWith('[');
  },

  arrayBufferLike(input?: any): input is ArrayBufferLike {
    const tag = Object.prototype.toString.call(input);
    return tag === '[object ArrayBuffer]' || tag === '[object SharedArrayBuffer]';
  },

  uint8Array(input?: any): input is Uint8Array {
    return Object.prototype.toString.call(input) === '[object Uint8Array]';
  },

  /**
   * Determine if the given value is a `NetAddr`.
   */
  netaddr(input): input is Deno.NetAddr {
    if (!isObject(input)) return false;
    const addr = input as Deno.NetAddr;

    if (!(addr.transport === 'tcp' || addr.transport === 'udp')) return false;
    return typeof addr.hostname === 'string' && typeof addr.port === 'number';
  },

  /**
   * Determine if the HTTP status code is within the 200 range.
   */
  statusOK(input) {
    if (typeof input !== 'number') return false;
    return String(input)[0] === '2';
  },

  httpStatus(input, status) {
    if (!isObject(input)) return false;
    const current = input as { status?: unknown; cause?: unknown };
    if (current.status === status) return true;
    return Is.httpStatus(current.cause, status);
  },

  /**
   * Determine if currently running within a web-worker.
   */
  worker() {
    const ctor = globalThis.constructor?.name;
    return (
      ctor === 'DedicatedWorkerGlobalScope' ||
      ctor === 'SharedWorkerGlobalScope' ||
      ctor === 'ServiceWorkerGlobalScope'
    );
  },

  /**
   * Determine if the given value (or the browser is environment) is "localhost".
   */
  localhost(value) {
    const isLocalhostHost = (host: unknown) =>
      Is.string(host) &&
      (host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '[::1]');

    if (value == null) {
      if (!Is.browser()) return false;
      return isLocalhostHost(window.location.hostname);
    } else {
      try {
        if (Is.string(value)) return isLocalhostHost(new URL(value).hostname);
        if (Is.object(value)) return isLocalhostHost(value.hostname);
      } catch (error) {
        return false;
      }
    }
    return false;
  },

  /**
   * Determine if the given value is an ['object', 'path'] array.
   */
  objectPath(input): input is t.ObjectPath {
    if (!Array.isArray(input)) return false;
    return input.every((item) => typeof item === 'string' || typeof item === 'number');
  },

  /**
   * Determine if the given value is an `AbortSignal`.
   * Liberal duck-typing: checks for `aborted` flag and listener APIs.
   */
  abortSignal(input): input is AbortSignal {
    if (!isObject(input)) return false;
    const o = input as AbortSignal;
    return (
      typeof o.aborted === 'boolean' &&
      typeof o.addEventListener === 'function' &&
      typeof o.removeEventListener === 'function'
    );
  },

  /**
   * Determine if the given value is an `AbortController`.
   * Fast duck-typing:
   *  - must be an object
   *  - must expose a `.signal` that is an AbortSignal
   *  - must expose an `.abort` function
   */
  abortController(input): input is AbortController {
    if (!isObject(input)) return false;
    const c = input as AbortController;
    return typeof c.abort === 'function' && !!c.signal && Is.abortSignal(c.signal);
  },

  /**
   * Determine if the value conforms to an "until" termination signal.
   */
  until(input?: unknown): input is t.Until {
    if (input === undefined) return false; // ergonomic at call-site, but not an until
    if (Array.isArray(input)) return input.every((v) => Is.until(v));
    if (Is.disposable(input)) return true;
    if (Is.observable(input)) return true;
    if (Is.subject(input)) return true;
    return false;
  },
};
