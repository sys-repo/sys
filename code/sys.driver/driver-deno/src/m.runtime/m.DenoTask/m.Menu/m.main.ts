import { Args, c, Cli, D, Err, Is, Str, type t } from './common.ts';
import { list } from '../m.list.ts';
import { run } from '../m.run.ts';

type ParsedArgs = {
  readonly help: boolean;
  readonly list: boolean;
  readonly nonInteractive: boolean;
  readonly unknown: readonly string[];
  readonly _: readonly string[];
};

/**
 * Run a wrapper-script task menu, including output, prompts, task dispatch, and exit-code shaping.
 */
export async function main(
  options: t.DenoTask.Menu.MainOptions,
): Promise<t.DenoTask.Menu.Result> {
  const args = parseArgs(options.argv ?? []);

  if (args.unknown.length > 0) {
    return fail(`Unknown option: ${args.unknown.join(', ')}`);
  }

  let tasks: readonly t.DenoTask.Task[];
  try {
    tasks = await list(options);
  } catch (error) {
    return fail(Err.summary(error));
  }

  if (args.help) {
    const text = formatHelp(options.title, tasks);
    print(text);
    return { kind: 'help', text };
  }

  if (args.list) {
    const text = formatList(options.title, tasks);
    print(text);
    return { kind: 'list', tasks, text };
  }

  if (args._.length > 1) return fail(`Unexpected argument: ${args._[1]}`);

  const requested = args._[0];
  if (requested) return await runSelected(options.cwd, tasks, requested);

  if (args.nonInteractive) {
    return fail('Missing task name in non-interactive mode.');
  }

  if (tasks.length === 0) return fail('No matching Deno tasks.');

  const picked = await promptTask(options.title, tasks);
  if (!Is.str(picked)) return { kind: 'exit' };

  return await runSelected(options.cwd, tasks, picked);
}

/**
 * Helpers:
 */
function parseArgs(argv: string[]): ParsedArgs {
  const normalized = argv[0] === '--' ? argv.slice(1) : argv;
  const unknown: string[] = [];
  const args = Args.parse<{
    help?: boolean;
    list?: boolean;
    'non-interactive'?: boolean;
  }>(normalized, {
    boolean: ['help', 'list', 'non-interactive'],
    alias: { h: ['help'], l: ['list'] },
    unknown(flag) {
      unknown.push(flag);
      return false;
    },
  });

  return {
    help: args.help ?? false,
    list: args.list ?? false,
    nonInteractive: args['non-interactive'] ?? false,
    unknown,
    _: args._.map(String),
  };
}

async function promptTask(
  title: string,
  tasks: readonly t.DenoTask.Task[],
): Promise<t.DenoTask.TaskName | symbol> {
  return await Cli.Input.Select.prompt<t.DenoTask.TaskName | symbol>({
    message: menuMessage(title),
    options: [
      ...tasks.map((task, index) => ({
        name: `${c.dim(Cli.Fmt.Tree.branch([index, tasks], 1))} ${task.name}`,
        value: task.name,
      })),
      { name: c.gray('(exit)'), value: D.Menu.exit },
    ],
    hideDefault: true,
  });
}

async function runSelected(
  cwd: t.StringDir,
  tasks: readonly t.DenoTask.Task[],
  name: string,
): Promise<t.DenoTask.Menu.Result> {
  const task = tasks.find((item) => item.name === name);
  if (!task) return fail(`Task is not included in this menu: ${name}`);

  const res = await run({ cwd, name: task.name });
  if (!res.output.success) Deno.exitCode = res.output.code;
  return { kind: 'selected', task, run: res };
}

function menuMessage(title: string): string {
  return Str.dedent(`
    ${c.cyan(title)}
  `);
}

function formatList(title: string, tasks: readonly t.DenoTask.Task[]): string {
  return [title, ...tasks.map((task) => task.name)].join('\n');
}

function formatHelp(title: string, tasks: readonly t.DenoTask.Task[]): string {
  return `${Str.dedent(`
    Browse tasks declared in deno.json.

    Usage:
      deno task <menu>
      deno task <menu> -- --list
      deno task <menu> -- --non-interactive <task-name>

    Options:
      --list, -l          List matching tasks without prompting.
      --non-interactive   Fail instead of prompting when no task name is given.
      --help, -h          Show this help.
  `)}\n\n${formatList(title, tasks)}`;
}

function print(text: string) {
  console.info(text);
}

function fail(message: string): t.DenoTask.Menu.Error {
  const text = c.yellow(`⚠ ${message}`);
  print(text);
  Deno.exitCode = 1;
  return { kind: 'error', code: 1, message, text };
}
