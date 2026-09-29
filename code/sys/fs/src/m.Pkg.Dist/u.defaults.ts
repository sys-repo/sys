import { Num } from '@sys/std/num';
import { Pkg } from '@sys/std/pkg';

/** Shared Dist defaults without producer or filesystem capability dependencies. */
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
