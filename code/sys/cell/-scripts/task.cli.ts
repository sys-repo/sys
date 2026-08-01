import { CellCli } from '../src/m.cli/mod.ts';

const Sample = {
  stripe: './-sample/cell.stripe',
  deploy: './-sample/cell.deploy',
  vite: './-sample/cell.vite',
  init: './-sample/foo',
} as const;

const argv = devArgs(Deno.args);
const res = await CellCli.run({ argv });
if (res.kind === 'error' || res.kind === 'kill') Deno.exitCode = res.code;

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
  return flagValue(args, '--mode') === 'dev' ? Sample.vite : Sample.stripe;
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

function flagValue(args: readonly string[], flag: string) {
  const index = args.indexOf(flag);
  if (index < 0) return undefined;
  const value = args[index + 1];
  return value && !value.startsWith('-') ? value : undefined;
}

function missingFlags(args: readonly string[], flags: readonly string[]) {
  return flags.filter((flag) => !args.includes(flag));
}

function hasPositionalDir(args: readonly string[], index: number) {
  return positional(args).length > index;
}

function positional(args: readonly string[]) {
  const result: string[] = [];
  for (let i = 0; i < args.length; i += 1) {
    const value = args[i];
    if (value.startsWith('--')) {
      const takesValue = value === '--format' || value === '--mode' || value === '--reporter';
      const next = args[i + 1];
      if (takesValue && next && !next.startsWith('-')) i += 1;
      continue;
    }
    if (value.startsWith('-')) continue;
    result.push(value);
  }
  return result;
}
