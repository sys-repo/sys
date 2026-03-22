import { c, Cli, Log, Paths, Process, type CmdResult } from './u.ts';

const ROOT_SCRIPT_TEST_COMMAND = `deno test -P=test --trace-leaks ./-scripts/-test/*.ts` as const;
const ROOT_SCRIPT_TEST_PATH = './-scripts/-test' as const;

export type TestTarget = {
  path: string;
  command: string;
  label: string;
};

export function targets(paths: readonly string[] = Paths.modules): readonly TestTarget[] {
  return [
    { path: ROOT_SCRIPT_TEST_PATH, command: ROOT_SCRIPT_TEST_COMMAND, label: 'root' },
    ...paths.map((path) => ({ path, command: 'deno task test', label: path })),
  ];
}

export async function main() {
  console.info();
  const spinner = Cli.spinner();

  /**
   * Run all tests across the mono-repo.
   */
  const results: CmdResult[] = [];
  const runRootScripts = async (total: number, command: string) => {
    const title = c.gray(`${c.white('Tests')} (${c.white('root')} of ${total})`);
    const commandFmt = c.green(c.bold(command));
    const moduleList = Log.moduleList({ indent: 3 });
    spinner.text = c.gray(`${title}\n  ${commandFmt}\n${moduleList}`);
    const output = await Process.sh({ path: '.', silent: true }).run(command);
    results.push({ output, path: ROOT_SCRIPT_TEST_PATH });
  };
  const run = async (path: string, index: number, total: number) => {
    const cmd = 'test';
    const command = `deno task ${cmd}`;
    const commandFmt = c.green(`deno task ${c.bold(c.cyan(cmd))}`);

    const title = c.gray(`${c.white('Tests')} (${c.white(String(index + 1))} of ${total})`);
    const moduleList = Log.moduleList({ index, indent: 3 });
    spinner.text = c.gray(`${title}\n  ${commandFmt}\n${moduleList}`);
    const output = await Process.sh({ path, silent: true }).run(command);
    results.push({ output, path });
  };

  try {
    const plan = targets(Paths.modules);
    const total = plan.length;
    await runRootScripts(total, plan[0].command);
    for (const [index, path] of Paths.modules.entries()) {
      await run(path, index + 1, total);
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
