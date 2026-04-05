import { Cli } from './common.ts';

const D = {
  tool: '@tdb/slc-data/cli',
} as const;

/**
 * CLI help formatting.
 */
export const FmtHelp = {
  input(toolname: string = D.tool) {
    return {
      tool: toolname,
      summary: 'Create stage configs and build staged SLC data outputs.',
      note: 'Interactive by default; use a subcommand for deterministic non-interactive runs.',
      usage: [
        `${toolname}`,
        `${toolname} create --profile <name> --source <path>`,
        `${toolname} stage --profile <name>`,
        `${toolname} stage --profile <name> --target <dir>`,
      ],
      options: [
        ['-h, --help', 'show help'],
        ['--profile <name>', 'config file to use'],
        ['--source  <path>', 'source folder to stage'],
        ['--target  <dir>', 'stage into <dir>/<mount> instead of the default root'],
      ] as const,
      examples: [
        `${toolname}`,
        `${toolname} --help`,
        `${toolname} create --profile my-data --source ./path/to/source`,
        `${toolname} stage  --profile my-data`,
        `${toolname} stage  --profile my-data --target ./public/data`,
      ],
    } as const;
  },

  output(toolname: string = D.tool): string {
    return Cli.Fmt.Help.build(FmtHelp.input(toolname));
  },
} as const;
