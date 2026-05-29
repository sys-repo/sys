import { type t } from '../common.ts';
import { parseArgs } from '../u/u.args.ts';
import { FmtHelp } from '../u.help/u.mod.ts';
import type { RunContext } from './u.context.ts';
import { runDsl } from './u.dsl.ts';
import { runInit } from './u.init.ts';
import { runMigrate } from './u.migrate.ts';
import { fail, print } from './u.output.ts';
import { runKill } from './u.kill.ts';
import { runStart } from './u.start.ts';
import { runTask } from './u.task.ts';

export const run: t.CellCli.Lib['run'] = async (input = {}) => {
  const argv = [...(input.argv ?? [])];
  const args = parseArgs(argv);
  const command = args._[0];
  const help = await FmtHelp.output();
  const ctx: RunContext = { argv, args };

  if (args.unknown.length > 0) {
    return fail({ argv }, `Unknown option: ${args.unknown.join(', ')}`, help);
  }

  if (!command && args.format !== undefined) {
    return fail({ argv }, 'Unexpected option without command: --format', help);
  }

  if (
    (!command && args.agent) ||
    (!command && args.dryRun) ||
    (!command && args.plan) ||
    (!command && args.force) ||
    (!command && args.mode !== undefined)
  ) {
    const flag = args.agent
      ? '--agent'
      : args.dryRun
      ? '--dry-run'
      : args.plan
      ? '--plan'
      : args.force
      ? '--force'
      : '--mode';
    return fail({ argv }, `Unexpected option without command: ${flag}`, help);
  }

  if ((!command && args.help) || argv.length === 0) {
    print(help);
    return { kind: 'help', input: { argv }, text: help };
  }

  if (!command) return fail({ argv }, 'Missing command.', help);

  if (command === 'init') return runInit(ctx);
  if (command === 'migrate') return runMigrate(ctx);
  if (command === 'dsl') return runDsl(ctx);
  if (command === 'task') return runTask(ctx);
  if (command === 'start') return runStart(ctx);
  if (command === 'kill') return runKill(ctx);

  return fail({ argv }, `Unknown command: ${command}`, help);
};
