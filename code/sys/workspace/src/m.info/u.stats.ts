import { type t, Fs } from './common.ts';

/**
 * Compute aggregate source statistics from explicit include and exclude globs.
 */
export async function stats(args: t.WorkspaceInfo.StatsArgs): Promise<t.WorkspaceInfo.StatsResult> {
  const cwd = args.cwd ?? Deno.cwd();
  const include = [...args.source.include];
  const exclude = [...(args.source.exclude ?? [])];
  const glob = Fs.glob(cwd, { includeDirs: false });
  const paths = new Set<string>();

  for (const pattern of include) {
    const files = await glob.find(pattern, { exclude });
    for (const file of files) {
      const info = await Deno.stat(file.path);
      if (info.isFile) paths.add(file.path);
    }
  }

  return {
    runtime: {
      deno: Deno.version.deno,
      typescript: Deno.version.typescript,
      v8: Deno.version.v8,
    },
    source: { include, exclude },
    files: paths.size,
    ...(args.totals?.lines ? { lines: await countLines([...paths]) } : {}),
  };
}

async function countLines(paths: readonly string[]) {
  let total = 0;

  await Promise.all(
    paths.map(async (path) => {
      const text = (await Fs.readText(path)).data ?? '';
      total += text.split('\n').length;
    }),
  );

  return total;
}
