import { c, Cli, Log, Process, type CmdResult } from './u.ts';
import { orderedWorkspacePaths } from './u.graph.ts';

export async function main() {
  console.info();
  const spinner = Cli.Spinner.create('');
  const paths = await orderedWorkspacePaths();

  const results: CmdResult[] = [];
  const run = async (path: string, index: number, total: number) => {
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

  try {
    const total = paths.length;
    for (const [index, path] of paths.entries()) {
      await run(path, index, total);
    }
    spinner.stop();
  } catch (err: any) {
    spinner.fail(Cli.Fmt.spinnerText(`Failed: ${err.message}`));
  } finally {
    spinner.stop();
  }

  /**
   * Output.
   */
  const title = `Code Check ${c.gray('(publish --dry-run)')}`;
  const success = Log.output(results, { title, pad: true });
  if (!success) throw new Error('Checks/Dry-Run Failed');
}
