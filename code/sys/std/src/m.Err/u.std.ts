import { type t, Delete, isObject } from './common.ts';
import { Is } from './m.Is.ts';
import { Name } from './m.Name.ts';

/**
 * Take unknown input and produce a standard error object.
 */
export const std: t.ErrLib['std'] = (input: any, opt = {}) => {
  const options = wrangle.options(opt);
  const errors = wrangle.aggregate(options);
  const name = wrangle.name(options);

  const done = (res: t.StdError) => (errors ? { ...res, errors } : res);

  if (Is.stdError(input)) {
    if (options.cause || options.errors || options.name) {
      return std(input.message, {
        name: options.name ?? input.name,
        cause: options.cause ?? input.cause,
        errors: options.errors ?? input.errors,
      });
    } else {
      return done(input);
    }
  }

  if (typeof input === 'string') {
    const message = input || wrangle.unknownMessage(input);
    const cause = wrangle.cause(undefined, options);
    return done(wrangle.errorObject(name, message, { cause }));
  }

  if (input instanceof Response) {
    const name = 'HttpError';
    const message = `${input.status} ${input.statusText}`;
    return done(wrangle.errorObject(name, message, {}));
  }

  if (Is.errorLike(input)) {
    const err = input as t.StdError;
    const message = err.message || wrangle.unknownMessage('ErrorLike');
    const cause = wrangle.cause((input as t.StdError).cause);
    return done(wrangle.errorObject(err.name || name, message, { cause }));
  }

  // Edge-case error input values.
  if (input === null) return done(wrangle.unknown('null', options));
  if (input === undefined) return done(wrangle.unknown('undefined', options));
  if (typeof input === 'number') return done(wrangle.unknown(String(input), options));
  if (typeof input === 'boolean') return done(wrangle.unknown(String(input), options));
  if (typeof input === 'symbol') return done(wrangle.unknown(String(input), options));
  if (typeof input === 'bigint') return done(wrangle.unknown(`BigInt(${input})`, options));
  if (typeof input === 'function') return done(wrangle.unknown('Function', options));
  if (Array.isArray(input)) return done(wrangle.unknown('Array', options));
  if (isObject(input)) return done(wrangle.unknown('Object', options));

  // Generically <unknown> error.
  return done(wrangle.unknown(typeof input, options));
};

const wrangle = {
  options(input?: t.ErrStdOptions | string) {
    if (!input) return {};
    if (typeof input === 'string') return { name: input };
    return input;
  },

  name(options: t.ErrStdOptions = {}) {
    if (options.name) return options.name;
    const errors = wrangle.aggregate(options);
    const name = errors ? Name.aggregate : Name.error;
    return name;
  },

  unknownMessage(value: unknown) {
    return `Unknown error (${value})`;
  },

  unknown(value: unknown, options: t.ErrStdOptions = {}): t.StdError {
    const name = wrangle.name(options);
    const message = wrangle.unknownMessage(value);
    const cause = options.cause ? std(options.cause) : undefined;
    return cause ? { name, message, cause } : { name, message };
  },

  cause(cause: unknown, options: t.ErrStdOptions = {}): t.StdError | undefined {
    if (cause !== undefined) return std(cause);
    if (options.cause !== undefined) return std(options.cause);
    return;
  },

  errorObject(name: string, message: string, options: { cause?: t.StdError } = {}): t.StdError {
    const { cause } = options;
    return Delete.undefined({ name, message, cause });
  },

  aggregate(options: t.ErrStdOptions): t.StdError[] | undefined {
    if (!Array.isArray(options.errors)) return undefined;
    return options.errors.map((err) => std(err));
  },
} as const;
