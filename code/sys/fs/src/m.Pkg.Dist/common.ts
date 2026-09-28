import { Pkg } from '@sys/std/pkg';
import { Num } from '../common.ts';

export { Fs } from '../m.Fs/mod.ts';
export { Path } from '../m.Path/mod.ts';
export { Pkg };

export * from '../common.ts';

export const D = {
  /** Finite local producer/observation bounds; remote verification still requires caller limits. */
  contentLimits: {
    manifestBytes: 16_777_216, // 16 MiB.
    entries: Pkg.Dist.Content.limits.entries, // 65,536 entries (also bounds implied directories).
    fileBytes: Num.MAX_INT,
    totalBytes: Num.MAX_INT,
  },
  hashPolicy: {
    path: 'src/m.Pkg.Dist/m.Dist.ts',
    ignore: { rules: ['dist.json', 'dist.json.sig'] as const },
  },
} as const;
