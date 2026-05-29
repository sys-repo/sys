import { Err, type t } from '../common.ts';
import { FmtHelp } from '../u.help/u.mod.ts';
import type { RunContext } from './u.context.ts';
import { fail, print } from './u.output.ts';

export async function runMigrate(ctx: RunContext): Promise<t.CellCli.Result> {
  const { args, argv } = ctx;
  const migrateHelp = await FmtHelp.migrateOutput();

  if (args.format !== undefined) {
    return fail({ argv }, 'Unexpected option for migrate: --format', migrateHelp);
  }
  if (args.plan) return fail({ argv }, 'Unexpected option for migrate: --plan', migrateHelp);
  if (args.force) return fail({ argv }, 'Unexpected option for migrate: --force', migrateHelp);
  if (args.mode !== undefined) {
    return fail({ argv }, 'Unexpected option for migrate: --mode', migrateHelp);
  }
  if (args.help) {
    print(migrateHelp);
    return { kind: 'help', input: { argv }, text: migrateHelp };
  }
  if (args.agent) return fail({ argv }, 'Unexpected option for migrate: --agent', migrateHelp);
  if (args._.length > 2) return fail({ argv }, `Unexpected argument: ${args._[2]}`, migrateHelp);

  try {
    const { formatMigrateResult, migrateCell } = await import('../u/u.migrate.ts');
    const res = await migrateCell({ dir: args._[1] ?? '.', dryRun: args.dryRun });
    const text = formatMigrateResult(res);
    print(text);
    return {
      kind: 'migrate',
      input: { argv },
      text,
      target: res.target,
      dryRun: res.dryRun,
      planned: res.planned,
      migrated: res.migrated,
      skipped: res.skipped,
    };
  } catch (error) {
    return fail({ argv }, Err.summary(error));
  }
}
