import { Args } from './common.ts';

export type StaticCliCommand = 'config' | 'config:add';

export type StaticCliArgs = {
  readonly _: readonly string[];
  readonly help?: boolean;
  readonly 'dry-run'?: boolean;
  readonly silent?: boolean;
  readonly config?: string;
  readonly name?: string;
  readonly dir?: string;
  readonly hostname?: string;
  readonly port?: string;
};

export type StaticCliParsedArgs = StaticCliArgs & {
  readonly command?: StaticCliCommand;
};

/** Parse CLI arguments for the static server owner CLI. */
export function parseArgs(argv: string[] = []): StaticCliParsedArgs {
  const args = Args.parse<StaticCliArgs>(argv, {
    alias: { h: 'help' },
    boolean: ['help', 'dry-run', 'silent'],
    string: ['config', 'name', 'dir', 'hostname', 'port'],
    unknown: (arg) => {
      throw new Error(`Unknown option: ${arg}`);
    },
  });

  return { ...args, command: parseCommand(args._) };
}

function parseCommand(args: readonly string[]): StaticCliCommand | undefined {
  if (args[0] !== 'config') return undefined;
  return args[1] === 'add' ? 'config:add' : 'config';
}
