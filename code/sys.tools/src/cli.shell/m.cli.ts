import { Args, D, Fmt, Fs, type t } from './common.ts';
import { doctor } from './u.doctor.ts';
import { formatDoctor } from './u.fmt.ts';

type CliDeps = {
  readonly doctor?: typeof doctor;
  readonly info?: (...data: unknown[]) => void;
};

export const cli: t.ShellToolsLib['cli'] = async (cwd, argv, _context, deps: CliDeps = {}) => {
  cwd = cwd ?? Fs.cwd('terminal');
  const args = parseArgs(argv ?? []);
  const info = deps.info ?? console.info;

  if (args.help || !args.command) {
    info(await help());
    return;
  }

  if (args.command === 'doctor') {
    const runDoctor = deps.doctor ?? doctor;
    info(formatDoctor(await runDoctor()));
  }
};

function parseArgs(argv: readonly string[]): t.ShellTool.CliParsedArgs {
  const args = Args.parse<t.ShellTool.CliArgs>([...argv], { alias: { h: 'help' } });
  const head = args._[0];
  return {
    ...args,
    command: head === 'doctor' ? head : undefined,
  };
}

async function help() {
  return await Fmt.help(D.tool.name, {
    usage: [
      `shell doctor`,
    ],
    options: [
      ['-h, --help', 'Show help.'],
    ],
    examples: [
      `${Fmt.invoke('shell', 'doctor')}`,
    ],
  });
}
