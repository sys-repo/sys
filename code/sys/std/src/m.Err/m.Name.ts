import type { t } from './common.ts';

/**
 * The standard named error types (JS).
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors
 */
export const Name: t.ErrNameLib = {
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
