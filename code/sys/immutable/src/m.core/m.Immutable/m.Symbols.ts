import type { t } from './common.ts';

/** Symbol registry used to tag immutable proxy internals. */
export const Symbols: t.ImmutableSymbolsMap = Object.freeze({
  map: Object.freeze({
    root: Symbol('map'),
    proxy: Symbol('map:proxy'),
    internal: Symbol('map:internal'),
  }),
});
