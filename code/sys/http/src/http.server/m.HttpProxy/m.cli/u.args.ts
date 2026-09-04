import { Args } from '../common.ts';

export type ProxyCliCommand = 'config' | 'config:add' | 'root' | 'root:set' | 'mount' | 'mount:add';

export type ProxyCliArgs = {
  readonly _: readonly string[];
  readonly help?: boolean;
  readonly 'dry-run'?: boolean;
  readonly config?: string;
  readonly name?: string;
  readonly hostname?: string;
  readonly port?: string;
  readonly mount?: string;
  readonly upstream?: string;
};

export type ProxyCliParsedArgs = ProxyCliArgs & {
  readonly command?: ProxyCliCommand;
};

/** Parse CLI arguments for the reverse-proxy owner CLI. */
export function parseArgs(argv: string[] = []): ProxyCliParsedArgs {
  const args = Args.parse<ProxyCliArgs>(argv, {
    alias: { h: 'help' },
    boolean: ['help', 'dry-run'],
    string: ['config', 'name', 'hostname', 'port', 'mount', 'upstream'],
    unknown: (arg) => {
      throw new Error(`Unknown option: ${arg}`);
    },
  });

  return { ...args, command: parseCommand(args._) };
}

function parseCommand(args: readonly string[]): ProxyCliCommand | undefined {
  if (args[0] === 'config') return args[1] === 'add' ? 'config:add' : 'config';
  if (args[0] === 'root') return args[1] === 'set' ? 'root:set' : 'root';
  if (args[0] === 'mount') return args[1] === 'add' ? 'mount:add' : 'mount';
  return undefined;
}
