import { parse as base, parseRange } from '@std/semver';
import { type t, Err } from './common.ts';
import { Prefix } from './m.Prefix.ts';

export const parse: t.SemverLib['parse'] = (input) => {
  try {
    const version = base(Prefix.strip(input!));
    return { version };
  } catch (cause: any) {
    const version = base('0.0.0');
    const error = Err.std(`Failed to parse semver: "${String(input)}"`, { cause });
    return { version, error };
  }
};

export const range: t.SemverLib['range'] = (input) => {
  type R = t.SemverRangeResponse;
  const done = (range: t.SemverRange): R => ({ range, error: errors.toError() });
  const fail = (error: string, cause?: t.StdError): R => {
    errors.push(error, { cause });
    return done(parseRange('*'));
  };

  const errors = Err.errors();
  if (typeof input !== 'string') {
    return fail(`Range input invalid: ${typeof input}`);
  }

  const text = (input || '').trim();
  if (!text) {
    return fail('Range value not given');
  }

  try {
    return done(parseRange(text));
  } catch (cause: any) {
    return fail(`Failed while parsing range: "${String(input)}"`);
  }
};
