import { c, Cli, Log, Paths, Process, type CmdResult } from './u.ts';

export async function main() {
  console.info();
  const spinner = Cli.spinner();

  const results: CmdResult[] = [];
  const run = async (path: string, index: number, total: number) => {
    const cmd = 'dry';
    const command = `deno task ${cmd}`;
    const commandFmt = `deno task ${c.bold(c.green(cmd))}`;

    const title = c.gray(`${c.white('Type Checks')} (${c.white(String(index + 1))} of ${total})`);
    const moduleList = Log.moduleList({ index, indent: 3 });

    const text = `${title}\n  ${c.cyan(commandFmt)}\n${moduleList}`;
    spinner.text = c.gray(text);

    const output = await Process.sh(path).run(command);
    results.push({ output, path });
  };

  try {
    const total = Paths.modules.length;
    for (const [index, path] of Paths.modules.entries()) {
      await run(path, index, total);
    }
    spinner.stop();
  } catch (err: any) {
    spinner.fail(`Failed: ${err.message}`);
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
