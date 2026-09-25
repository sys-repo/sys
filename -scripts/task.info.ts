import { Cli } from '@sys/cli';
import { Time } from '@sys/std/time';
import { type t, Workspace } from '@sys/workspace';

const Fmt = {
  scanning() {
    return Cli.Fmt.spinnerText('scanning workspace...', false);
  },

  scanned(stats: t.WorkspaceInfo.StatsResult, startedAt: number) {
    const text = `scanned ${stats.files.toLocaleString()} files in ${Time.elapsed(startedAt)}`;
    return Cli.Fmt.spinnerText(text, true);
  },

  failed() {
    return Cli.Fmt.spinnerText('workspace info failed', false);
  },
} as const;

export async function main() {
  async function info() {
    const startedAt = Time.now.timestamp;
    const spinner = Cli.spinner(Fmt.scanning());

    try {
      const cwd = Deno.cwd();
      const graphPath = Workspace.Prep.State.graphFile(cwd);
      const [stats, graphSnapshot] = await Promise.all([
        Workspace.Info.stats({
          cwd,
          packages: {
            workspace: './deno.json',
            scope: '@sys',
          },
          source: {
            kind: 'package',
            include: ['**/*.{ts,tsx}'],
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
        }),
        Workspace.Prep.Graph.read(cwd),
      ]);
      if (!graphSnapshot) {
        throw new Error(`Workspace info graph snapshot is missing or invalid: "${graphPath}"`);
      }

      spinner.succeed(Fmt.scanned(stats, startedAt));
      console.info(Workspace.Info.fmt(stats, {
        graph: {
          path: graphPath,
          snapshot: graphSnapshot,
        },
      }));
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
