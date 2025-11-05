export * from '../common.ts';

export const Symbols = {
  map: {
    root: Symbol('map'),
    proxy: Symbol('map:proxy'),
    internal: Symbol('map:internal'),
  },
} as const;
