import type { t } from './common.ts';
import { parseArgs } from './u.args.ts';
import { FmtHelp } from './u.help.ts';

/**
 * Cell operator CLI.
 */
export const CellCli: t.CellCli.Lib = {
  async run(input = {}) {
    const argv = [...(input.argv ?? [])];
    const args = parseArgs(argv);
    const help = await FmtHelp.output();

    if (args.help || argv.length === 0) {
      console.info(help);
      console.info();
      return { kind: 'help', input: { argv }, text: help };
    }

    console.info('@sys/cell/cli currently exposes --help only.');
    console.info();
    console.info(help);
    console.info();

    return { kind: 'error', input: { argv }, text: help, code: 1 };
  },
};
