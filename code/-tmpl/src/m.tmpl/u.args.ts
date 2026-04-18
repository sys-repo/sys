import { Args } from './common.ts';

export type CliArgs = {
  bundle?: boolean;
  dryRun?: boolean;
  'dry-run'?: boolean;
  force?: boolean;
  dir?: string;
  name?: string;
  pkgName?: string;
  help?: boolean;
  'non-interactive'?: boolean;
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
    alias: { h: 'help', 'dry-run': 'dryRun' },
    boolean: ['bundle', 'dryRun', 'dry-run', 'force', 'help', 'non-interactive'],
    string: ['dir', 'name', 'pkgName'],
    default: { bundle: false, dryRun: false, 'dry-run': false, force: false, help: false },
  });

  const tmpl = args._[0];
  const interactive = args['non-interactive'] !== true;
  const dryRun = args.dryRun === true || args['dry-run'] === true;
  return {
    ...args,
    tmpl,
    interactive,
    bundle: args.bundle === true,
    dryRun,
    force: args.force === true,
  };
}
