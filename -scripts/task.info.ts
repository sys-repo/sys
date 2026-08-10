import { Cli } from '@sys/cli';
import { Time } from '@sys/std/time';
import { type t, Workspace } from '@sys/workspace';

const Fmt = {
  scanning() {
    return Cli.Fmt.spinnerText('scanning workspace...', false);
  },

  scanned(stats: t.WorkspaceInfo.StatsResult, startedAt: number) {
    return Cli.Fmt.spinnerText(
      `scanned ${stats.files.toLocaleString()} files in ${Time.elapsed(startedAt)}`,
      true,
    );
  },

  failed() {
    return Cli.Fmt.spinnerText('workspace source scan failed', false);
  },
} as const;

export async function main() {
  async function info() {
    const startedAt = Time.now.timestamp;
    const spinner = Cli.spinner(Fmt.scanning());

    try {
      const stats = await Workspace.Info.stats({
        cwd: Deno.cwd(),
        source: {
          kind: 'glob',
          include: ['code/**/*.{ts,tsx}'],
          exclude: [
            '**/node_modules/**',
            '**/_archive/**',
            '**/.tmp/**',
            '**/.pi/**',
            '**/spikes/**',
            '**/compiler/**',
            '**/compiler.samples/**',
            '**/dist/**',
          ],
        },
        totals: { lines: true },
      });
      spinner.succeed(Fmt.scanned(stats, startedAt));
      console.info(Workspace.Info.fmt(stats));
    } catch (error) {
      spinner.fail(Fmt.failed());
      throw error;
    }
  }

  /**
   * System/Repo info.
   */
  await info();
  console.info();
}

if (import.meta.main) await main();
