import type { t } from './common.ts';

export const Symbols: t.ImmutableSymbolsMap = {
  map: {
    root: Symbol('map'),
    proxy: Symbol('map:proxy'),
    internal: Symbol('map:internal'),
  },
};
