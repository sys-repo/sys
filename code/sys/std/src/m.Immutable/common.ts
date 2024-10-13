export * from '../common.ts';

export { Delete } from '../m.Delete/mod.ts';
export { slug } from '../m.Id/mod.ts';
export { ObjectPath } from '../m.ObjectPath/mod.ts';
export { rx } from '../m.Rx/mod.ts';

export const Symbols = {
  map: {
    root: Symbol('map'),
    proxy: Symbol('map:proxy'),
    internal: Symbol('map:internal'),
  },
} as const;
