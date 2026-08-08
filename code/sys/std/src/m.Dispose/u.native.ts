import { Is } from './common.ts';

type NativeSymbolSource = {
  readonly dispose?: typeof Symbol.dispose;
  readonly asyncDispose?: typeof Symbol.asyncDispose;
};

/** Require native synchronous Explicit Resource Management authority. */
export function requireSymbolDispose(source: NativeSymbolSource = Symbol): typeof Symbol.dispose {
  const symbol = source.dispose;
  if (Is.nil(symbol)) {
    throw new TypeError(
      'Native ECMAScript Explicit Resource Management requires Symbol.dispose',
    );
  }
  return symbol;
}

/** Require native asynchronous Explicit Resource Management authority. */
export function requireSymbolAsyncDispose(
  source: NativeSymbolSource = Symbol,
): typeof Symbol.asyncDispose {
  const symbol = source.asyncDispose;
  if (Is.nil(symbol)) {
    throw new TypeError(
      'Native ECMAScript Explicit Resource Management requires Symbol.asyncDispose',
    );
  }
  return symbol;
}
