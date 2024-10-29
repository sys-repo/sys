import type { t } from './common.ts';

/**
 * The standard named error types.
 */
export const Name: t.ErrName = {
  error: 'Error',
  aggregate: 'AggregateError',
  eval: 'EvalError',
  range: 'RangeError',
  reference: 'ReferenceError',
  syntax: 'SyntaxError',
  type: 'TypeError',
  uri: 'URIError',
  compile: 'CompileError',
  link: 'LinkError',
  runtime: 'RuntimeError',
  internal: 'InternalError',
};
