import { DenoTask } from '@sys/driver-deno/runtime';
import { Cli, Err, Str, type t } from '../src/m.cli/common.ts';
import { setExitCode } from '../src/m.cli/u/u.exit.ts';

type Choice = (typeof samples)[number]['name'] | '(exit)';
type Dependencies = {
  readonly menu?: typeof DenoTask.Menu.main;
  readonly interactive?: typeof Cli.Is.interactive;
  readonly select?: typeof Cli.Input.Select.prompt<Choice>;
  readonly confirm?: typeof Cli.Input.Confirm.prompt;
  readonly runCli?: t.CellCli.Lib['run'];
};

const samples = [
  { name: 'sample:stripe', root: './-sample/cell.stripe', mode: 'default' },
  { name: 'sample:deploy:start', root: './-sample/cell.deploy', mode: 'default' },
  { name: 'sample:vite', root: './-sample/cell.vite', mode: 'default' },
] as const;

export async function main(argv = Deno.args, deps: Dependencies = {}): Promise<number> {
  const args = argv[0] === '--' ? argv.slice(1) : argv;
  const kill = args.length === 1 && args[0] === 'kill';
  const nonInteractiveKill = args.length === 2 && args.includes('kill') &&
    args.includes('--non-interactive');
  if (nonInteractiveKill) return fail('Sample cleanup requires an interactive terminal.');
  if (kill) {
    try {
      return await cleanup(deps);
    } catch (error) {
      return fail(Err.summary(error));
    }
  }

  const menu = deps.menu ?? DenoTask.Menu.main;
  const picking = args.length === 0;
  if (picking) printHeader('START');
  const title = picking ? 'Choose a sample task' : '@sys/cell';
  const result = await menu({ cwd: '.', argv, title, include: ['sample:*'] });
  if (result.kind === 'selected') return result.run.output.code;
  return result.kind === 'error' ? result.code : 0;
}

if (import.meta.main) setExitCode(await main());

/**
 * Helpers:
 */
async function cleanup(deps: Dependencies) {
  const interactive = deps.interactive ?? Cli.Is.interactive;
  if (!interactive()) return fail('Sample cleanup requires an interactive terminal.');

  const select = deps.select ?? Cli.Input.Select.prompt<Choice>;
  printHeader('KILL');
  const choice = await select({
    message: 'Choose where Cell should look for sessions and listeners',
    options: [...samples.map(({ name }) => ({ name, value: name })), '(exit)'],
    hideDefault: true,
  });
  if (choice === '(exit)') return 0;
  const sample = samples.find(({ name }) => name === choice);
  if (!sample) return fail('Unknown sample cleanup target.');

  const { root, mode } = sample;
  const argv = ['kill', root, '--mode', mode];
  const runCli = deps.runCli ?? (await import('../src/m.cli/mod.ts')).CellCli.run;
  const preview = await runCli({ argv: [...argv, '--dry-run'] });
  if (preview.kind === 'error') return preview.code;
  if (preview.kind !== 'kill' || !preview.dryRun) return fail('Expected a Cell kill preview.');
  if (preview.code !== 0) return preview.code;
  const findings = [...preview.sessions, ...preview.resources];
  if (!findings.some(({ status }) => status === 'would-terminate')) return 0;

  const confirm = deps.confirm ?? Cli.Input.Confirm.prompt;
  const message = Str.dedent(`
    Cleanup for ${root} (mode: ${mode})
    Cell will scan again. It may remove dead session records and stop recorded
    supervisors and processes it finds listening at declared addresses.
    Those processes may be unrelated or different from the preview.
    SIGTERM can escalate to SIGKILL.
    Run this cleanup?
  `);
  if (await confirm({ message, default: false }) !== true) return 0;

  const result = await runCli({ argv });
  if (result.kind === 'error' || (result.kind === 'kill' && !result.dryRun)) return result.code;
  return fail('Expected a live Cell kill result.');
}

function printHeader(action: 'START' | 'KILL') {
  const title = `${action} · @sys/cell samples`;
  const tone = action === 'KILL' ? 'yellow' : 'green';
  console.info(Cli.Fmt.Header.rows({ title, tone }).join('\n'));
}

function fail(message: string) {
  console.error(message);
  return 1;
}
