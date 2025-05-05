import { type t, isEmptyRecord, isObject, isRecord } from '../common.ts';
import { Err } from '../m.Err/mod.ts';

const { errorLike, stdError } = Err.Is;

/**
 * Common flag evaluators.
 */
export const Is: t.StdIsLib = {
  errorLike,
  stdError,

  object: isObject,
  record: isRecord,
  emptyRecord: isEmptyRecord,

  disposable(input?: any): input is t.Disposable {
    if (!isObject(input)) return false;
    const obj = input as t.Disposable;
    return typeof obj.dispose === 'function' && Is.observable(obj.dispose$);
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
      Number.isNaN(input) // Handle NaN at runtime
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

  /** Determine if the value is a promise. */
  promise<T = any>(input?: any): input is Promise<T> {
    return input !== null && input
      ? typeof input === 'object' && typeof input.then === 'function'
      : false;
  },

  /** Determine if the value is numeric, whether it be a number or a number in a string. */
  numeric(input?: any) {
    if (typeof input === 'number') {
      return Number.isFinite(input); // Ensure not: NaN, Infinity, or -Infinity.
    }
    if (typeof input === 'bigint') {
      return true;
    }

    if (typeof input === 'string') {
      const trimmed = input.trim();
      if (trimmed === '') return false; // Empty string, not a number.
      const num = Number(trimmed);
      return !Number.isNaN(num) && Number.isFinite(num);
    }

    return false;
  },

  func(input?: any): input is Function {
    return typeof input === 'function';
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

  /**
   * Determines if currently running within a browser environment.
   */
  browser() {
    const g = globalThis;
    return typeof g.window === 'object' && typeof g.document === 'object';
  },
};
