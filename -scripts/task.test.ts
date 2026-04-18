import { c, Cli, Log, Process, type CmdResult, type t } from './u.ts';
import { orderedWorkspacePaths } from './u.graph.ts';

const ROOT_SCRIPT_TEST_COMMAND = `deno test -P=test --trace-leaks ./-scripts/-test/*.ts` as const;
const ROOT_SCRIPT_TEST_PATH = './-scripts/-test' as const;

export type TestTarget = {
  path: string;
  command: string;
  label: string;
};

export function targets(paths: readonly string[]): readonly TestTarget[] {
  return [
    { path: ROOT_SCRIPT_TEST_PATH, command: ROOT_SCRIPT_TEST_COMMAND, label: 'root' },
    ...paths.map((path) => ({ path, command: 'deno task test', label: path })),
  ];
}

export async function main() {
  console.info();
  const paths = await orderedWorkspacePaths();

  /**
   * Run all tests across the mono-repo.
   */
  const results: CmdResult[] = [];
  const runRootScripts = async (
    spinner: t.CliSpinner.Instance,
    total: number,
    command: string,
  ) => {
    const title = c.gray(`${c.white('Tests')} (${c.white('root')} of ${total})`);
    const commandFmt = c.green(c.bold(command));
    const moduleList = Log.moduleList(paths, { indent: 3 });
    spinner.start(Cli.Fmt.spinnerText(c.gray(`${title}\n  ${commandFmt}\n${moduleList}`)));
    const output = await Process.sh({ path: '.', silent: true }).run(command);
    results.push({ output, path: ROOT_SCRIPT_TEST_PATH });
  };
  const run = async (
    spinner: t.CliSpinner.Instance,
    path: string,
    index: number,
    total: number,
  ) => {
    const cmd = 'test';
    const command = `deno task ${cmd}`;
    const commandFmt = c.green(`deno task ${c.bold(c.cyan(cmd))}`);

    const title = c.gray(`${c.white('Tests')} (${c.white(String(index + 1))} of ${total})`);
    const moduleList = Log.moduleList(paths, { index, indent: 3 });
    spinner.start(Cli.Fmt.spinnerText(c.gray(`${title}\n  ${commandFmt}\n${moduleList}`)));
    const output = await Process.sh({ path, silent: true }).run(command);
    results.push({ output, path });
  };

  await Cli.Spinner.with('', async (spinner) => {
    try {
      const plan = targets(paths);
      const total = plan.length;
      await runRootScripts(spinner, total, plan[0].command);
      for (const [index, path] of paths.entries()) {
        await run(spinner, path, index + 1, total);
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
  const success = Log.output(results, { title: 'Tests', pad: true });
  if (!success) throw new Error('Tests Failed');
}
