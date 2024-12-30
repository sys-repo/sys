import { c, Cli, Proc, Log, Path, Paths, type CmdResult } from './u.ts';

export async function main() {
  console.info();
  const spinner = Cli.spinner();

  /**
   * Run all tests across the mono-repo.
   */
  const results: CmdResult[] = [];
  const run = async (path: string, index: number, total: number) => {
    const command = `deno task test`;
    const title = c.gray(`${c.white('Tests')} (${c.white(String(index + 1))} of ${total})`);
    const modulePath = c.gray(`${Path.dirname(path)}/${c.white(Path.basename(path))}`);
    spinner.text = c.gray(`${title}\n  ${c.cyan(command)}\n  → ${modulePath}\n`);
    const output = await Proc.sh({ silent: true, path }).run(command);
    results.push({ output, path });
  };

  try {
    const total = Paths.modules.length;
    for (const [index, path] of Paths.modules.entries()) {
      await run(path, index, total);
    }
    spinner.succeed(c.gray(`${c.white('Complete')} (${c.green(total.toString())})`));
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
