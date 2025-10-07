import type { ErrNameLib } from './t.ts';

/**
 * The standard named error types (JS).
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors
 */
export const Name: ErrNameLib = {
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
