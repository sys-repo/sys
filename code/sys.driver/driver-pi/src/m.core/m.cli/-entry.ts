import { Arr, Fs, type t } from './common.ts';
import { main as cli } from './m.main.ts';
import { Profiles } from '../m.cli.profiles/mod.ts';

export type EntryInput = {
  readonly argv?: readonly string[];
  readonly cwd?: t.StringDir;
};

export type EntryResult = t.PiCli.Result | t.PiCliProfiles.Result;

/**
 * Process entry point shared by `@sys/driver-pi` and `@sys/driver-pi/cli`.
 */
export async function main(input: EntryInput = {}): Promise<EntryResult> {
  const argv = input.argv ?? Deno.args;
  const cwd = input.cwd ?? Fs.cwd('process');

  if (Arr.startsWith(argv, ['Profiles'])) {
    return Profiles.main({ argv: argv.slice(1), cwd });
  }

  return cli({ argv, cwd });
}
