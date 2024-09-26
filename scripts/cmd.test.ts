import { Cmd, Log, type CmdResult } from './u.ts';

/**
 * Run all tests across the mono-repo.
 */
const results: CmdResult[] = [];
const run = async (path: string, args = '') => {
  const output = await Cmd.sh({ silent: true, path }).run(`deno test ${args}`);
  results.push({ output, path });
};

// Std Libs.
await run('code/sys/std', '-RWN');
await run('code/sys/std-s', '-RWNE --allow-run');

// Drivers.
await run('code/sys.driver/driver-deno-cloud', '-RWNE');
await run('code/sys.driver/driver-automerge', '-RWE');

/**
 * Output.
 */
const success = Log.output(results, { title: 'Tests', pad: true });
if (!success) throw new Error('Tests Failed');
