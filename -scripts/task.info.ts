import { Monorepo } from '@sys/monorepo';
import { c } from './common.ts';

export async function main() {
  async function info() {
    const stats = await Monorepo.Info.stats({
      cwd: Deno.cwd(),
      source: {
        include: ['code/**/*.{ts,tsx}'],
        exclude: [
          '**/node_modules/**',
          '**/_archive/**',
          '**/.tmp/**',
          '**/spikes/**',
          '**/compiler/**',
          '**/compiler.samples/**',
          '**/dist/**',
        ],
      },
      totals: { lines: true },
    });

    console.info(`  ${c.yellow('Deno')}.version  `, c.green(Deno.version.deno));
    console.info('    typescript  ', c.green(Deno.version.typescript));
    console.info('            v8  ', c.green(Deno.version.v8));

    console.info(c.bold('  ↓'));
    console.info(c.yellow('  Monorepo'));
    console.info(c.dim('  pattern.code  '), c.dim(stats.source.include[0] ?? ''));
    console.info('         files  ', c.yellow(stats.files.toLocaleString()));
    console.info('         lines  ', c.yellow((stats.lines ?? 0).toLocaleString()));
  }

  /**
   * System/Repo info.
   */
  console.log();
  await info();
  console.info();
}
