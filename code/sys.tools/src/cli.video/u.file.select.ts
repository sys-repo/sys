import { type t, c, Cli, Fs } from './common.ts';

/**
 * Multi-select arbitrary files in a directory (defaults to common video types).
 * - Filters hidden files.
 * - Sorts by basename.
 */
export async function selectFiles(
  dir: t.StringDir,
  exts: string[] = ['.mp4', '.webm', '.mov', '.mkv'],
): Promise<readonly t.StringPath[]> {
  const wanted = new Set(exts.map((e) => e.toLowerCase()));

  const files = (await Fs.toDir(dir).ls())
    .filter((p) => wanted.size === 0 || wanted.has(Fs.extname(p).toLowerCase()))
    .filter((p) => !Fs.basename(p).startsWith('.'))
    .sort((a, b) => Fs.basename(a).localeCompare(Fs.basename(b)));

  if (files.length === 0) {
    const label = wanted.size === 0 ? 'files' : Array.from(wanted).join(',');
    console.warn(`No ${label} found in: ${Fs.trimCwd(dir, { prefix: true })}`);
    return [];
  }

  const options = files.map((abs) => ({
    name: Fs.trimCwd(abs, { prefix: true }),
    value: abs,
  }));

  const selected =
    (await Cli.Input.Checkbox.prompt<t.StringPath>({
      message: 'Choose files',
      options,
    })) ?? [];

  return selected;
}
