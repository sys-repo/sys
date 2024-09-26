export * from '../common.ts';

export { Delete } from '../u.Delete/mod.ts';
export { slug } from '../u.Id/mod.ts';
export { ObjectPath } from '../u.ObjectPath/mod.ts';
export { rx } from '../u.Observable/mod.ts';

export const Symbols = {
  map: {
    root: Symbol('map'),
    proxy: Symbol('map:proxy'),
    internal: Symbol('map:internal'),
  },
} as const;
