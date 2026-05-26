import { Args, c, Cli } from '@sys/cli';
import { Fs } from '@sys/fs';
import { Process } from '@sys/process';
import { Is } from '@sys/std/is';
import { Obj } from '@sys/std/obj';
import { Str } from '@sys/std/str';

type O = Record<string, unknown>;

type SampleTask = {
  readonly name: string;
};

type Pick = SampleTask['name'] | 'exit';

type ParsedArgs = {
  readonly help: boolean;
  readonly list: boolean;
  readonly unknown: readonly string[];
};

const args = parseArgs(Deno.args);
const samples = await loadSampleTasks();

if (args.unknown.length > 0) {
  console.info(formatHelp(samples, `Unknown option: ${args.unknown.join(', ')}`));
  Deno.exitCode = 1;
} else if (args.help) {
  console.info(formatHelp(samples));
} else if (args.list) {
  console.info(formatList(samples));
} else {
  const picked = await promptSample(samples);
  if (picked === 'exit') Deno.exitCode = 0;
  else await runSample(picked);
}

/**
 * Helpers:
 */
function parseArgs(argv: string[]): ParsedArgs {
  const normalized = argv[0] === '--' ? argv.slice(1) : argv;
  const unknown: string[] = [];
  const args = Args.parse<{ help?: boolean; list?: boolean }>(normalized, {
    boolean: ['help', 'list'],
    alias: { h: ['help'], l: ['list'] },
    unknown(flag) {
      unknown.push(flag);
      return false;
    },
  });

  return {
    help: args.help ?? false,
    list: args.list ?? false,
    unknown,
  };
}

async function loadSampleTasks(): Promise<SampleTask[]> {
  const res = await Fs.readJson<{ readonly tasks?: O }>('./deno.json');
  if (!res.ok || !res.data) {
    throw new Error(`Failed to read deno.json: ${res.error?.message ?? res.errorReason}`);
  }

  return sampleTasks(Is.record(res.data.tasks) ? res.data.tasks : {});
}

function sampleTasks(tasks: O): SampleTask[] {
  const samples: SampleTask[] = [];

  for (const [name, command] of Obj.entries(tasks)) {
    if (!Is.str(name) || !name.startsWith('sample:')) continue;
    if (!Is.str(command)) continue;
    samples.push({ name });
  }

  return samples;
}

async function promptSample(samples: SampleTask[]): Promise<Pick> {
  if (samples.length === 0) {
    console.info(c.yellow('No sample tasks found in deno.json.'));
    return 'exit';
  }

  return await Cli.Input.Select.prompt<Pick>({
    message: menuMessage(),
    options: [
      ...samples.map((sample, index) => ({
        name: `${c.dim(Cli.Fmt.Tree.branch([index, samples], 1))} ${sample.name}`,
        value: sample.name,
      })),
      { name: c.gray('(exit)'), value: 'exit' },
    ],
    hideDefault: true,
  });
}

async function runSample(name: string) {
  const res = await Process.inherit({ cmd: 'deno', args: ['task', name], cwd: Fs.cwd('process') });
  if (!res.success) Deno.exitCode = res.code;
}

function menuMessage(): string {
  return Str.dedent(`
    ${c.cyan('@sys/cell')} samples
  `);
}

function formatList(samples: SampleTask[]): string {
  const title = Str.trimEdgeNewlines(Cli.stripAnsi(menuMessage()));
  const lines = samples.map((sample) => sample.name);
  return [title, ...lines].join('\n');
}

function formatHelp(samples: SampleTask[], warning?: string): string {
  const prelude = warning ? `${c.yellow(`⚠ ${warning}`)}\n\n` : '';
  const list = samples.length > 0 ? formatList(samples) : 'No sample tasks found in deno.json.';
  const help = Str.dedent(`
    Browse sample tasks declared in deno.json.

    Usage:
      deno task sample
      deno task sample -- --list
      deno task sample -- --help

    Options:
      --list, -l   List discovered sample tasks without prompting.
      --help, -h   Show this help.
  `);

  return `${prelude}${help}\n\n${list}`;
}
