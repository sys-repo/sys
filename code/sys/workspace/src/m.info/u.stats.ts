import { Fs, type t } from './common.ts';
import { classifyPath } from './u.classify.ts';

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

type LineStats = {
  readonly total: number;
  readonly source: number;
  readonly unitTests: number;
  readonly uiSpecTests: number;
};

type FileLineStats = {
  readonly kind: t.WorkspaceInfo.LineKind;
  readonly lines: number;
};

/**
 * Compute aggregate source statistics from explicit include and exclude globs.
 */
export async function stats(args: t.WorkspaceInfo.StatsArgs): Promise<t.WorkspaceInfo.StatsResult> {
  const input = normalizeArgs(args);
  const paths = await collectSourcePaths(input.cwd, input.source);
  const lineStats = input.totals.lines ? await countLineStats(paths) : undefined;

  return toResult(input, paths, lineStats);
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

async function countLineStats(paths: readonly t.StringPath[]): Promise<LineStats> {
  const files = await Promise.all(paths.map((path) => countFileLines(path)));

  return files.reduce<LineStats>(
    (acc, file) => {
      return {
        total: acc.total + file.lines,
        source: acc.source + (file.kind === 'source' ? file.lines : 0),
        unitTests: acc.unitTests + (file.kind === 'unit-test' ? file.lines : 0),
        uiSpecTests: acc.uiSpecTests + (file.kind === 'ui-spec-test' ? file.lines : 0),
      };
    },
    { total: 0, source: 0, unitTests: 0, uiSpecTests: 0 },
  );
}

async function countFileLines(path: t.StringPath): Promise<FileLineStats> {
  const text = (await Fs.readText(path)).data ?? '';
  return {
    kind: classifyPath(path),
    lines: text.split('\n').length,
  };
}

function toResult(
  input: NormalizedArgs,
  paths: readonly t.StringPath[],
  lineStats: LineStats | undefined,
): t.WorkspaceInfo.StatsResult {
  return {
    runtime: {
      deno: Deno.version.deno,
      typescript: Deno.version.typescript,
      v8: Deno.version.v8,
    },
    source: input.source,
    files: paths.length,
    ...(lineStats === undefined ? {} : {
      lines: lineStats.total,
      lineBreakdown: {
        source: lineStats.source,
        unitTests: lineStats.unitTests,
        uiSpecTests: lineStats.uiSpecTests,
      },
    }),
  };
}
