import type { t } from '../common.ts';
import { parseArgs } from '../u/u.args.ts';
import { FmtHelp } from '../u.help/u.mod.ts';
import type { RunContext } from './u.context.ts';
import { runDsl } from './u.dsl.ts';
import { runInfo } from './u.info.ts';
import { runInit } from './u.init.ts';
import { runMigrate } from './u.migrate.ts';
import { fail, print } from './u.output.ts';
import { runKill } from './u.kill.ts';
import { runStart } from './u.start.ts';
import { runTask } from './u.task.ts';

export const run: t.CellCli.Lib['run'] = async (input = {}) => {
  const argv = [...(input.argv ?? [])];
  const runInput: t.CellCli.Input = { ...input, argv };
  const args = parseArgs(argv);
  const command = args._[0];
  const help = await FmtHelp.output();
  const ctx: RunContext = { input: runInput, args };

  if (args.unknown.length > 0) {
    return fail(runInput, `Unknown option: ${args.unknown.join(', ')}`, help);
  }

  if (!command && args.format !== undefined) {
    return fail(runInput, 'Unexpected option without command: --format', help);
  }

  if (
    (!command && args.agent) ||
    (!command && args.dryRun) ||
    (!command && args.plan) ||
    (!command && args.force) ||
    (!command && args.mode !== undefined) ||
    (!command && args.reporter !== undefined)
  ) {
    const flag = args.agent
      ? '--agent'
      : args.dryRun
      ? '--dry-run'
      : args.plan
      ? '--plan'
      : args.force
      ? '--force'
      : args.mode !== undefined
      ? '--mode'
      : '--reporter';
    return fail(runInput, `Unexpected option without command: ${flag}`, help);
  }

  if ((!command && args.help) || argv.length === 0) {
    print(help);
    return { kind: 'help', input: runInput, text: help };
  }

  if (!command) return fail(runInput, 'Missing command.', help);

  if (command === 'info') return runInfo(ctx);
  if (command === 'init') return runInit(ctx);
  if (command === 'migrate') return runMigrate(ctx);
  if (command === 'dsl') return runDsl(ctx);
  if (command === 'task') return runTask(ctx);
  if (command === 'start') return runStart(ctx);
  if (command === 'kill') return runKill(ctx);

  return fail(runInput, `Unknown command: ${command}`, help);
};
