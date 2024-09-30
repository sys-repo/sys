import type { t } from '../common.ts';
import { Delete } from '../u.Delete/mod.ts';
import { Is } from './u.Err.Is.ts';
import { isObject } from './u.ts';

/**
 * Default values for Errors.
 */
export const DEFAULTS = { name: 'Error' } as const;

/**
 * Helpers for working with errors.
 */
export const Err: t.ErrLib = {
  Is,

  /**
   * Take unknown input and produce a standard error object.
   */
  stdError(input: any, options = {}) {
    const { name = DEFAULTS.name } = options;

    if (Is.stdError(input)) return input;

    if (typeof input === 'string') {
      const message = input || wrangle.unknownMessage(input);
      const cause = wrangle.cause(undefined, options);
      return wrangle.errorObject(name, message, cause);
    }

    if (Is.errorLike(input)) {
      const err = input as t.StdError;
      const message = err.message || wrangle.unknownMessage('ErrorLike');
      const name = err.name || DEFAULTS.name;
      const cause = wrangle.cause((input as t.StdError).cause);
      return wrangle.errorObject(name, message, cause);
    }

    // Edge-case error input values.
    if (input === null) return wrangle.unknown('null', options);
    if (input === undefined) return wrangle.unknown('undefined', options);
    if (typeof input === 'number') return wrangle.unknown(String(input), options);
    if (typeof input === 'boolean') return wrangle.unknown(String(input), options);
    if (typeof input === 'symbol') return wrangle.unknown(String(input), options);
    if (typeof input === 'bigint') return wrangle.unknown(`BigInt(${String(input)})`, options);
    if (typeof input === 'function') return wrangle.unknown('Function', options);
    if (Array.isArray(input)) return wrangle.unknown('Array', options);
    if (isObject(input)) return wrangle.unknown('Object', options);

    // Generically unknown error.
    return wrangle.unknown(typeof input, options);
  },
};

/**
 * Helpers
 */
const wrangle = {
  unknownMessage(value: unknown) {
    return `Unknown error (${String(value)})`;
  },

  unknown(value: unknown, options: t.ErrStdErrorOptions = {}): t.StdError {
    const { name = DEFAULTS.name } = options;
    const message = wrangle.unknownMessage(value);
    const cause = options.cause ? Err.stdError(options.cause) : undefined;
    return cause ? { name, message, cause } : { name, message };
  },

  cause(cause: unknown, options: t.ErrStdErrorOptions = {}): t.StdError | undefined {
    if (cause !== undefined) return Err.stdError(cause);
    if (options.cause !== undefined) return Err.stdError(options.cause);
    return;
  },

  errorObject(name: string, message: string, cause?: t.StdError): t.StdError {
    return Delete.undefined({ name, message, cause });
  },
} as const;
