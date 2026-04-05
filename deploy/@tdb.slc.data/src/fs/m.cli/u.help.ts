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
      summary: 'Create profile configs and build staged SLC data outputs.',
      note: 'Interactive by default; use a subcommand for deterministic non-interactive runs.',
      usage: [
        `${toolname}`,
        `${toolname} create --profile <name> --source <path>`,
        `${toolname} stage  --profile <name>`,
        `${toolname} stage  --profile <name> --target <dir>`,
        `${toolname} refresh --target <dir>`,
      ],
      options: [
        ['-h, --help', 'show help'],
        ['--profile <name>', 'profile file to use'],
        ['--source  <path>', "mapping's source folder"],
        ['--target  <dir>', 'stage mappings under <dir>/<mount>'],
      ] as const,
      examples: [
        `${toolname}`,
        `${toolname} --help`,
        `${toolname} create  --profile my-data --source ./path/to/source`,
        `${toolname} stage   --profile my-data`,
        `${toolname} stage   --profile my-data --target ./public/data`,
        `${toolname} refresh --target ./public/data`,
      ],
    } as const;
  },

  output(toolname: string = D.tool): string {
    return Cli.Fmt.Help.build(FmtHelp.input(toolname));
  },
} as const;
