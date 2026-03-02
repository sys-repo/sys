import { Fs, c } from './common.ts';
import { cli } from './m.cli.ts';
import { parseArgs } from './u.args.ts';
import { makeBundle } from './u.makeBundle.ts';

export async function entry(argv: string[] = Deno.args) {
  try {
    const args = parseArgs(argv);
    if (args.bundle) {
      await makeBundle();
    } else {
      await cli(Fs.cwd('terminal'), args);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const failed = c.bold(c.yellow('Failed:'));
    console.info();
    console.warn(c.gray(`${failed} ${message}`));
    console.info();
    Deno.exitCode = 1;
  }
}
