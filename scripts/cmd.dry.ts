import { c, Cmd, Log, type CmdResult } from './u.ts';

const results: CmdResult[] = [];
const run = async (path: string) => {
  const output = await Cmd.sh(path).run(`deno publish --allow-dirty --dry-run`);
  results.push({ output, path });
};

// Std Libs.
await run('code/sys/std');
await run('code/sys/std-s');

// Drivers.
await run('code/sys.driver/driver-deno-cloud');
await run('code/sys.driver/driver-automerge');

/**
 * Output.
 */
const title = `Code Check ${c.gray('(publish --dry-run)')}`;
const success = Log.output(results, { title, pad: true });
if (!success) throw new Error('Checks/Dry-Run Failed');
