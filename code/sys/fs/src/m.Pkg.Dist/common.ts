export { Fs } from '../m.Fs/mod.ts';
export { Path } from '../m.Path/mod.ts';
export { Pkg } from '@sys/std/pkg';

export * from '../common.ts';

export const D = {
  hashPolicy: {
    path: 'src/m.Pkg.Dist/m.Dist.ts',
    ignore: { rules: ['dist.json', 'dist.json.sig'] as const },
  },
} as const;
