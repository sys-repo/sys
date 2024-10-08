import { Cmd, Log, Paths, type CmdResult } from './u.ts';

export async function main() {
  /**
   * Run the linter across the mono-repo.
   */
  const results: CmdResult[] = [];
  const run = async (path: string) => {
    const output = await Cmd.sh({ silent: true, path }).run(`deno lint`);
    results.push({ output, path });
  };

  for (const path of Paths.modules) {
    await run(path);
  }

  /**
   * Output.
   */
  const success = Log.output(results, { title: 'Lint', pad: true });
  if (!success) throw new Error('Lint Failed');
}
