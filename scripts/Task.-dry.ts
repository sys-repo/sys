import { c, Cli, Cmd, Log, Path, Paths, type CmdResult } from './u.ts';

export async function main() {
  console.info();
  const spinner = Cli.spinner();

  const results: CmdResult[] = [];
  const run = async (path: string, index: number, total: number) => {
    const command = `deno publish --allow-dirty --dry-run`;
    const title = c.gray(`${c.white('Type Checks')} (${index + 1} of ${total})`);
    const modulePath = c.gray(`${Path.dirname(path)}/${c.white(Path.basename(path))}`);
    spinner.text = c.gray(`${title}\n  ${c.cyan(command)}\n  → ${modulePath}\n`);
    const output = await Cmd.sh(path).run(command);
    results.push({ output, path });
  };

  try {
    const total = Paths.modules.length;
    for (const [index, path] of Paths.modules.entries()) {
      await run(path, index, total);
    }
    spinner.succeed();
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
