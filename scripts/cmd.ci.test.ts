import { Cmd, Log, Paths, type CmdResult } from './u.ts';

/**
 * Run all tests across the mono-repo.
 */
const results: CmdResult[] = [];
const run = async (path: string) => {
  const output = await Cmd.sh({ silent: true, path }).run(`deno task test`);
  results.push({ output, path });
};

for (const path of Paths.modules) {
  await run(path);
}

/**
 * Output.
 */
const success = Log.output(results, { title: 'Tests', pad: true });
if (!success) throw new Error('Tests Failed');
