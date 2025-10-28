import { type t, c, Cli, Process, Str } from './common.ts';

export type FfmpegResult = {
  readonly is: { readonly installed: boolean };
  readonly version: t.StringSemver;
};

/**
 * Check whether `ffmpeg` is installed and accessible on the system PATH.
 * Logs installation instructions if missing.
 *
 * @returns `true` if ffmpeg is available, otherwise `false`.
 */
export async function getVersion(opts: { silent?: boolean } = {}): Promise<FfmpegResult> {
  const { silent = false } = opts;

  // Query `ffmpeg`:
  const out = await Process.run('ffmpeg -version', { silent: true });
  const installed = out.success;

  const none = '0.0.0' as t.StringSemver;
  const version = installed
    ? // Example first line: "ffmpeg version 7.0.2 Copyright (c) ..."
      (out.text.stdout.match(/^ffmpeg version ([^\s]+)/)?.[1] ?? none)
    : none;

  // Print warning:
  if (!installed && !silent) {
    const msg = Str.builder()
      .line(c.red('\n⚠️  `ffmpeg` not found on system PATH.'))
      .line(c.gray('Please install it before running this command.'))
      .line()
      .line(fmtFfmpegInstall())
      .line()
      .toString();
    console.error(msg);
  }

  return {
    is: { installed },
    version,
  } as const;
}

export function fmtFfmpegInstall() {
  const table = Cli.table([]);
  table.push([c.green('macOS:'), 'brew install ffmpeg']);
  table.push([c.green('Ubuntu/Debian:'), 'sudo apt install ffmpeg']);
  return table.toString().trim();
}

/**
 * Namespace for `ffmpeg` helpers.
 */
export const Ffmpeg = {
  getVersion,
};
