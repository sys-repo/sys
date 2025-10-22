import { type t, c, Cli, Fs } from './common.ts';

type SelectArgs = {
  readonly dir: t.StringDir;
  readonly conversion: t.Conversion;
};

/**
 * Prompt the user to choose a single source file (legacy).
 */
export async function selectSourceFile(args: SelectArgs): Promise<t.StringPath | null> {
  const files = await listCandidates(args);
  if (files.length === 0) {
    warnNone(args);
    return null;
  }
  const options = files.map((abs) => ({
    name: Fs.trimCwd(abs, { prefix: true }),
    value: abs,
  }));

  const choice = await Cli.Prompt.Select.prompt<t.StringPath>({
    message:
      args.conversion === 'webm-to-mp4'
        ? 'Choose a .webm file to convert → .mp4'
        : 'Choose a .mp4 file to convert → .webm',
    options,
  });

  return choice ?? null;
}

/**
 * Multi-select: choose one or more source files.
 */
export async function selectSourceFiles(args: SelectArgs): Promise<readonly t.StringPath[]> {
  const files = await listCandidates(args);
  if (files.length === 0) {
    warnNone(args);
    return [];
  }
  const options = files.map((abs) => ({
    name: Fs.trimCwd(abs, { prefix: true }),
    value: abs,
  }));

  const selected =
    (await Cli.Prompt.Checkbox.prompt<t.StringPath>({
      message:
        args.conversion === 'webm-to-mp4'
          ? 'Choose .webm files to convert → .mp4'
          : 'Choose .mp4 files to convert → .webm',
      options,
      check: c.green('●'),
      uncheck: c.gray('○'),
    })) ?? [];

  return selected;
}

/**
 * Helpers:
 */
function extsFor(conversion: t.Conversion): ReadonlySet<string> {
  return conversion === 'webm-to-mp4' ? new Set(['.webm']) : new Set(['.mp4']);
}

async function listCandidates(args: SelectArgs): Promise<t.StringPath[]> {
  const { dir, conversion } = args;
  const wanted = extsFor(conversion);
  const files = await Fs.toDir(dir).ls();
  return files
    .filter((p) => wanted.has(Fs.extname(p).toLowerCase()))
    .filter((p) => !Fs.basename(p).startsWith('.'))
    .sort((a, b) => Fs.basename(a).localeCompare(Fs.basename(b)));
}

function warnNone(args: SelectArgs) {
  const { dir, conversion } = args;
  const label = conversion === 'webm-to-mp4' ? '.webm' : '.mp4';
  console.warn(`No ${label} files found in: ${Fs.trimCwd(dir, { prefix: true })}`);
}
