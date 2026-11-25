import { CellCli } from '../src/m.cli/mod.ts';
import { parseArgs } from '../src/m.cli/u/u.args.ts';
import { setExitCode } from '../src/m.cli/u/u.exit.ts';

const Sample = {
  stripe: './-sample/cell.stripe',
  deploy: './-sample/cell.deploy',
  init: './-sample/foo',
} as const;

if (import.meta.main) {
  const res = await CellCli.run({ argv: devArgs(Deno.args) });
  setExitCode(res.kind === 'error' || res.kind === 'kill' ? res.code : Deno.exitCode);
}

/** Apply repository sample defaults without redirecting explicit targets or service modes. */
export function devArgs(argv: readonly string[]): readonly string[] {
  const args = argv[0] === '--' ? argv.slice(1) : argv;
  const [command] = args;
  if (!command) return args;
  if (hasHelp(args)) return args;

  if (command === 'info') return withDefaultDir(args, Sample.stripe);
  if (command === 'start' || command === 'kill') {
    return parseArgs(args).mode === undefined ? withDefaultDir(args, Sample.stripe) : args;
  }
  if (command === 'migrate') return withDefaultDir(args, Sample.stripe, ['--dry-run']);
  if (command === 'init') return withDefaultDir(args, Sample.init, ['--dry-run']);
  if (command === 'task') return taskArgs(args);

  return args;
}

function taskArgs(args: readonly string[]): readonly string[] {
  if (args.length === 1) return ['task', 'sample:deploy', Sample.deploy, '--plan'];
  return hasPositionalDir(args, 2) ? args : [...args, Sample.deploy];
}

function withDefaultDir(
  args: readonly string[],
  dir: string,
  flags: readonly string[] = [],
): readonly string[] {
  return hasPositionalDir(args, 1) ? args : [...args, dir, ...missingFlags(args, flags)];
}

function hasHelp(args: readonly string[]) {
  return args.includes('-h') || args.includes('--help');
}

function missingFlags(args: readonly string[], flags: readonly string[]) {
  return flags.filter((flag) => !args.includes(flag));
}

function hasPositionalDir(args: readonly string[], index: number) {
  return parseArgs(args)._.length > index;
}
