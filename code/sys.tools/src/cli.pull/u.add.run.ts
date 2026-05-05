import { done, Err, type t } from './common.ts';
import { addHttpBundle } from './u.add.ts';
import { Fmt } from './u.fmt.ts';

export async function runAdd(
  cwd: t.StringDir,
  args: t.PullTool.CliParsedArgs,
): Promise<t.RunReturn> {
  try {
    if (args._.length > 1) throw new Error(`Unexpected argument: ${args._[1]}`);

    const result = await addHttpBundle({
      cwd,
      config: args.config ?? '',
      dist: args.dist ?? '',
      local: args.local ?? '',
      dryRun: args['dry-run'] === true,
    });
    console.info(Fmt.addResult(result));
    return done(0);
  } catch (error) {
    console.info(Fmt.addError(Err.summary(error)));
    return done(1);
  }
}
