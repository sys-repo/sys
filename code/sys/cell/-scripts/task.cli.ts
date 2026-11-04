import { Is, Path } from '../src/common.ts';
import { CellCli } from '../src/m.cli/mod.ts';
import { parseArgs } from '../src/m.cli/u/u.args.ts';
import { startReporterFlag } from '../src/m.cli/m.run/u.reporter.ts';

const Sample = {
  stripe: './-sample/cell.stripe',
  deploy: './-sample/cell.deploy',
  vite: './-sample/cell.vite',
  init: './-sample/foo',
} as const;

const VITE_SAMPLE = Path.fromFileUrl(new URL('../-sample/cell.vite', import.meta.url));
type Run = (argv: readonly string[]) => Promise<number>;

export async function main(
  args: readonly string[] = Deno.args,
  deps: { readonly runCli?: Run; readonly runVite?: Run } = {},
): Promise<number> {
  const normalized = args[0] === '--' ? args.slice(1) : args;
  const argv = devArgs(normalized);
  if (isViteStart(argv)) {
    const run = deps.runVite ?? (await import('./u.cli.vite.ts')).runVite;
    return run(argv);
  }
  return (deps.runCli ?? runCli)(argv);
}

if (import.meta.main) Deno.exitCode = await main();

async function runCli(argv: readonly string[]): Promise<number> {
  const res = await CellCli.run({ argv });
  return res.kind === 'error' || res.kind === 'kill' ? res.code : Deno.exitCode;
}

/**
 * Helpers:
 */
function devArgs(args: readonly string[]): readonly string[] {
  const [command] = args;
  if (!command) return args;
  if (hasHelp(args)) return args;

  if (command === 'info') return withDefaultDir(args, Sample.stripe);
  if (command === 'start') return withDefaultDir(args, serviceSample(args));
  if (command === 'kill') return withDefaultDir(args, serviceSample(args));
  if (command === 'migrate') return withDefaultDir(args, Sample.stripe, ['--dry-run']);
  if (command === 'init') return withDefaultDir(args, Sample.init, ['--dry-run']);
  if (command === 'task') return taskArgs(args);

  return args;
}

function taskArgs(args: readonly string[]): readonly string[] {
  if (args.length === 1) return ['task', 'sample:deploy', Sample.deploy, '--plan'];
  return hasPositionalDir(args, 2) ? args : [...args, Sample.deploy];
}

function serviceSample(args: readonly string[]) {
  return parseArgs(args).mode === 'dev' ? Sample.vite : Sample.stripe;
}

/** Only the maintained Vite sample's valid dev-start route changes execution authority. */
function isViteStart(argv: readonly string[]): boolean {
  const args = parseArgs(argv);
  const [command, dir] = args._;
  return command === 'start' && args.mode === 'dev' && Is.str(dir) &&
    Path.resolve(dir) === VITE_SAMPLE && args._.length === 2 &&
    !args.help && !args.agent && !args.dryRun && !args.plan && !args.force &&
    args.format === undefined && args.unknown.length === 0 && startReporterFlag(args.reporter).ok;
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
