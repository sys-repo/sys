import { c, Cmd, Log, Paths, type CmdResult } from './u.ts';

const results: CmdResult[] = [];
const run = async (path: string) => {
  const output = await Cmd.sh(path).run(`deno publish --allow-dirty --dry-run`);
  results.push({ output, path });
};

for (const path of Paths.modules) {
  await run(path);
}

/**
 * Output.
 */
const title = `Code Check ${c.gray('(publish --dry-run)')}`;
const success = Log.output(results, { title, pad: true });
if (!success) throw new Error('Checks/Dry-Run Failed');
