import { done, Err, type t } from './common.ts';
import { addDistBundle } from './u.add.ts';
import { Fmt } from './u.fmt.ts';

export async function runAdd(
  cwd: t.StringDir,
  args: t.PullTool.CliParsedArgs,
): Promise<t.RunReturn> {
  try {
    if (args._.length > 1) throw new Error(`Unexpected argument: ${args._[1]}`);

    const result = await addDistBundle({
      cwd,
      config: args.config ?? '',
      manifest: args.manifest ?? '',
      integrity: args.integrity ?? '',
      store: args.store ?? '',
      project: args.project,
      mode: args.mode,
      dryRun: args['dry-run'] === true,
    });
    console.info(Fmt.addResult(result));
    return done(0);
  } catch (error) {
    console.info(Fmt.addError(Err.summary(error)));
    return done(1);
  }
}
