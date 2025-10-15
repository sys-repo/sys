import { type t, Cli, Fs } from './common.ts';

type SelectArgs = {
  readonly dir: t.StringDir;
  readonly conversion: t.Conversion;
};

/**
 * Prompt the user to choose a source file for the given conversion.
 * Returns the absolute path, or `null` if there are no candidates.
 */
export async function selectSourceFile(args: SelectArgs): Promise<t.StringPath | null> {
  const { dir, conversion } = args;

  const wanted = extsFor(conversion);
  const files = await Fs.toDir(dir).ls(); // list file paths in dir

  const candidates = files
    .filter((p) => wanted.has(Fs.extname(p).toLowerCase()))
    .filter((p) => !Fs.basename(p).startsWith('.')) // skip dotfiles
    .sort((a, b) => Fs.basename(a).localeCompare(Fs.basename(b)));

  if (candidates.length === 0) {
    const label = conversion === 'webm-to-mp4' ? '.webm' : '.mp4';
    console.warn(`No ${label} files found in: ${Fs.trimCwd(dir, { prefix: true })}`);
    return null;
  }

  const options = candidates.map((abs) => ({
    name: Fs.trimCwd(abs, { prefix: true }),
    value: abs,
  }));

  const choice = await Cli.Prompt.Select.prompt<t.StringPath>({
    message:
      conversion === 'webm-to-mp4'
        ? 'Choose a .webm file to convert → .mp4'
        : 'Choose a .mp4 file to convert → .webm',
    options,
  });

  return choice ?? null;
}

/**
 * Helpers:
 */
function extsFor(conversion: t.Conversion): ReadonlySet<string> {
  return conversion === 'webm-to-mp4' ? new Set(['.webm']) : new Set(['.mp4']);
}
