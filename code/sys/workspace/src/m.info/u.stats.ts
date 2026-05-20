import { Fs, type t } from './common.ts';

type NormalizedArgs = {
  readonly cwd: t.StringDir;
  readonly source: {
    readonly include: readonly t.StringPath[];
    readonly exclude: readonly t.StringPath[];
  };
  readonly totals: {
    readonly lines: boolean;
  };
};

/**
 * Compute aggregate source statistics from explicit include and exclude globs.
 */
export async function stats(args: t.WorkspaceInfo.StatsArgs): Promise<t.WorkspaceInfo.StatsResult> {
  const input = normalizeArgs(args);
  const paths = await collectSourcePaths(input.cwd, input.source);
  const lines = input.totals.lines ? await countLines(paths) : undefined;

  return toResult(input, paths, lines);
}

function normalizeArgs(args: t.WorkspaceInfo.StatsArgs): NormalizedArgs {
  return {
    cwd: args.cwd ?? Deno.cwd(),
    source: {
      include: [...args.source.include],
      exclude: [...(args.source.exclude ?? [])],
    },
    totals: {
      lines: args.totals?.lines === true,
    },
  };
}

async function collectSourcePaths(
  cwd: t.StringDir,
  source: NormalizedArgs['source'],
): Promise<t.StringPath[]> {
  const glob = Fs.glob(cwd, { includeDirs: false });
  const paths = new Set<t.StringPath>();

  for (const pattern of source.include) {
    const files = await glob.find(pattern, { exclude: source.exclude });
    for (const file of files) {
      if (await isRegularFile(file.path)) paths.add(file.path);
    }
  }

  return [...paths].sort();
}

async function isRegularFile(path: t.StringPath): Promise<boolean> {
  const info = await Deno.stat(path);
  return info.isFile;
}

async function countLines(paths: readonly t.StringPath[]): Promise<number> {
  const counts = await Promise.all(paths.map((path) => countFileLines(path)));
  return counts.reduce((total, count) => total + count, 0);
}

async function countFileLines(path: t.StringPath): Promise<number> {
  const text = (await Fs.readText(path)).data ?? '';
  return text.split('\n').length;
}

function toResult(
  input: NormalizedArgs,
  paths: readonly t.StringPath[],
  lines: number | undefined,
): t.WorkspaceInfo.StatsResult {
  return {
    runtime: {
      deno: Deno.version.deno,
      typescript: Deno.version.typescript,
      v8: Deno.version.v8,
    },
    source: input.source,
    files: paths.length,
    ...(lines === undefined ? {} : { lines }),
  };
}
