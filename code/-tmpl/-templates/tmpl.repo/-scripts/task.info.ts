import { Monorepo } from '@sys/workspace';

export async function main(cwd = Deno.cwd()) {
  const stats = await Monorepo.Info.stats({
    cwd,
    source: {
      include: ['code/**/*.{ts,tsx}'],
      exclude: ['**/node_modules/**', '**/.tmp/**', '**/dist/**'],
    },
    totals: { lines: true },
  });

  console.info();
  console.info(Monorepo.Info.fmt(stats));
  console.info();
}

if (import.meta.main) await main();
