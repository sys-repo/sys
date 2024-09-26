import { Cmd, Log, type CmdResult } from './u.ts';

/**
 * Run all tests across the mono-repo.
 */
const results: CmdResult[] = [];
const run = async (path: string) => {
  const output = await Cmd.sh({ silent: true, path }).run(`deno task test`);
  results.push({ output, path });
};

// Std Libs
await run('code/sys/std');
await run('code/sys/std-s');
await run('code/sys.ui/ui-react');

// Drivers.
await run('code/sys.driver/driver-deno-cloud');
await run('code/sys.driver/driver-automerge');

/**
 * Output.
 */
const success = Log.output(results, { title: 'Tests', pad: true });
if (!success) throw new Error('Tests Failed');
