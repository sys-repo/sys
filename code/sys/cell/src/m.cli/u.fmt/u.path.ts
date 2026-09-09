import { Cli, Fs } from '../common.ts';

export const FmtPath = Object.freeze(
  {
    display(path: string): string {
      return Cli.Fmt.Path.str(Fs.trimCwd(path));
    },
  } as const,
);
