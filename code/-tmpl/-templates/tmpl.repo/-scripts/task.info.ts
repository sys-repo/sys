import { Monorepo } from '@sys/monorepo';
import { c } from './common.ts';

export async function main(cwd = Deno.cwd()) {
  const stats = await Monorepo.Info.stats({
    cwd,
    source: {
      include: ['code/**/*.{ts,tsx}'],
      exclude: ['**/node_modules/**', '**/.tmp/**', '**/dist/**'],
    },
    totals: { lines: true },
  });

}

if (import.meta.main) await main();
