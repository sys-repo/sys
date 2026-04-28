import { Workspace } from '@sys/workspace';

export async function main() {
  async function info() {
    const stats = await Workspace.Info.stats({
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
    console.info(Workspace.Info.fmt(stats));
  }

  /**
   * System/Repo info.
   */
  console.log();
  await info();
  console.info();
}

if (import.meta.main) await main();
