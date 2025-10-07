export * from '../common.ts';

export { Delete } from '../m.Delete/mod.ts';
export { Is } from '../m.Is/mod.ts';
export { slug } from '../m.Random/mod.ts';
export { Rx } from '../m.Rx/mod.ts';
export { Arr } from '../m.Value.Arr/mod.ts';
export { Obj } from '../m.Value.Obj/mod.ts';

export const Symbols = {
  map: {
    root: Symbol('map'),
    proxy: Symbol('map:proxy'),
    internal: Symbol('map:internal'),
  },
} as const;
