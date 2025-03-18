import { c, Cli, Log, Paths, Process, type CmdResult } from './u.ts';

export async function main() {
  console.info();
  const spinner = Cli.spinner();

  /**
   * Run all tests across the mono-repo.
   */
  const results: CmdResult[] = [];
  const run = async (path: string, index: number, total: number) => {
    const cmd = 'test';
    const command = `deno task ${cmd}`;
    const commandFmt = `deno task ${c.bold(c.green(cmd))}`;

    const title = c.gray(`${c.white('Tests')} (${c.white(String(index + 1))} of ${total})`);
    const moduleList = Log.moduleList({ index, indent: 3 });
    spinner.text = c.gray(`${title}\n  ${c.cyan(commandFmt)}\n${moduleList}`);
    const output = await Process.sh({ path, silent: true }).run(command);
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
  const success = Log.output(results, { title: 'Tests', pad: true });
  if (!success) throw new Error('Tests Failed');
}
