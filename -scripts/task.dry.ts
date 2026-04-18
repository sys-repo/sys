import { c, Cli, Log, Process, type CmdResult, type t } from './u.ts';
import { orderedWorkspacePaths } from './u.graph.ts';

export async function main() {
  console.info();
  const paths = await orderedWorkspacePaths();

  const results: CmdResult[] = [];
  const run = async (
    spinner: t.CliSpinner.Instance,
    path: string,
    index: number,
    total: number,
  ) => {
    const cmd = 'dry';
    const command = `deno task ${cmd}`;
    const commandFmt = c.green(`deno task ${c.bold(c.cyan(cmd))}`);

    const title = c.gray(`${c.white('Type Checks')} (${c.white(String(index + 1))} of ${total})`);
    const moduleList = Log.moduleList(paths, { index, indent: 3 });

    const text = `${title}\n  ${commandFmt}\n${moduleList}`;
    spinner.start(Cli.Fmt.spinnerText(c.gray(text)));

    const output = await Process.sh(path).run(command);
    results.push({ output, path });
  };

  await Cli.Spinner.with('', async (spinner) => {
    try {
      const total = paths.length;
      for (const [index, path] of paths.entries()) {
        await run(spinner, path, index, total);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      spinner.fail(Cli.Fmt.spinnerText(`Failed: ${message}`));
      throw err;
    }
  });

  /**
   * Output.
   */
  const title = `Code Check ${c.gray('(publish --dry-run)')}`;
  const success = Log.output(results, { title, pad: true });
  if (!success) throw new Error('Checks/Dry-Run Failed');
}
