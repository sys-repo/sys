import { Args } from '../common.ts';
import { assertStrictPortFlag } from '../../u.strictPortFlag.ts';

export type ProxyCliCommand = 'config' | 'config:add' | 'root' | 'root:set' | 'mount' | 'mount:add';

export type ProxyCliArgs = {
  readonly _: readonly string[];
  readonly help?: boolean;
  readonly 'dry-run'?: boolean;
  readonly 'strict-port'?: boolean;
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
  assertStrictPortFlag(argv);
  const args = Args.parse<ProxyCliArgs>(argv, {
    alias: { h: 'help' },
    boolean: ['help', 'dry-run', 'strict-port'],
    string: ['config', 'name', 'hostname', 'port', 'mount', 'upstream'],
    unknown: (arg) => {
      throw new Error(`Unknown option: ${arg}`);
    },
  });

  const command = parseCommand(args._);
  if (args['strict-port'] !== undefined && command !== 'config:add') {
    throw new Error('Use config add to set --strict-port.');
  }
  return { ...args, command };
}

function parseCommand(args: readonly string[]): ProxyCliCommand | undefined {
  if (args[0] === 'config') return args[1] === 'add' ? 'config:add' : 'config';
  if (args[0] === 'root') return args[1] === 'set' ? 'root:set' : 'root';
  if (args[0] === 'mount') return args[1] === 'add' ? 'mount:add' : 'mount';
  return undefined;
}
