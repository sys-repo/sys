import { Monorepo } from '@sys/monorepo';

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
    console.info(Monorepo.Info.fmt(stats));
  }

  /**
   * System/Repo info.
   */
  console.log();
  await info();
  console.info();
}
