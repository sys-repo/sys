import { c, Cli, Process } from './common.ts';

/**
 * Check whether `ffmpeg` is installed and accessible on the system PATH.
 * Logs installation instructions if missing.
 *
 * @returns `true` if ffmpeg is available, otherwise `false`.
 */
export async function checkFfmpegInstalled(opts: { silent?: boolean } = {}): Promise<boolean> {
  const { silent = false } = opts;

  // Check exists:
  const res = await Process.run(`ffmpeg -version`, { silent: true });
  if (res.success) return true;

  // Print warning:
  const table = Cli.table([]);
  table.push([c.green('macOS:'), 'brew install ffmpeg']);
  table.push([c.green('Ubuntu/Debian:'), 'sudo apt install ffmpeg']);

  const msg = [
    c.red('\n⚠️  `ffmpeg` not found on system PATH.\n'),
    c.gray('Please install it before running this command.\n'),
    '',
    table.toString(),
  ].join('');

  if (!silent) console.error(msg);
  return false;
}
