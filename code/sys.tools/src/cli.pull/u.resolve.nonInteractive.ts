import { Fs, Is, type t } from './common.ts';

export function resolveNonInteractive(
  cwd: t.StringDir,
  args: t.PullTool.CliParsedArgs,
): {
  readonly config: t.StringPath;
} {
  const raw = Is.str(args.config) ? args.config.trim() : '';
  if (!raw) {
    throw new Error('Missing required flag: --config (required with --non-interactive).');
  }

  return { config: Fs.resolve(cwd, raw) };
}
