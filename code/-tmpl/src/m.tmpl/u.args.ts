import { Args } from './common.ts';

export type CliArgs = {
  bundle?: boolean;
  dryRun?: boolean;
  force?: boolean;
  dir?: string;
  name?: string;
  pkgName?: string;
  help?: boolean;
  'no-interactive'?: boolean;
};

export type CliParsedArgs = {
  _: string[];
} & CliArgs & {
  tmpl?: string;
  interactive: boolean;
  dryRun: boolean;
  force: boolean;
  bundle: boolean;
};

export function parseArgs(argv: string[] = []): CliParsedArgs {
  const args = Args.parse<CliArgs>(argv, {
    alias: { h: 'help' },
    boolean: ['bundle', 'dryRun', 'force', 'help', 'no-interactive'],
    string: ['dir', 'name', 'pkgName'],
    default: { bundle: false, dryRun: false, force: false, help: false },
  });

  const tmpl = args._[0];
  const interactive = args['no-interactive'] !== true;
  return {
    ...args,
    tmpl,
    interactive,
    bundle: args.bundle === true,
    dryRun: args.dryRun === true,
    force: args.force === true,
  };
}
