import { isSymbol } from '../common/u.is.ts';

type DisposalProtocolSymbolSource = {
  dispose?: unknown;
  asyncDispose?: unknown;
};

/** Require synchronous ECMAScript disposal protocol authority. */
export function requireSymbolDispose(
  source: DisposalProtocolSymbolSource = Symbol,
): typeof Symbol.dispose {
  const symbol = source.dispose;
  if (!isSymbol(symbol)) {
    throw new TypeError('ECMAScript disposal protocol requires Symbol.dispose');
  }
  return symbol as typeof Symbol.dispose;
}

/** Require asynchronous ECMAScript disposal protocol authority. */
export function requireSymbolAsyncDispose(
  source: DisposalProtocolSymbolSource = Symbol,
): typeof Symbol.asyncDispose {
  const symbol = source.asyncDispose;
  if (!isSymbol(symbol)) {
    throw new TypeError('ECMAScript disposal protocol requires Symbol.asyncDispose');
  }
  return symbol as typeof Symbol.asyncDispose;
}
