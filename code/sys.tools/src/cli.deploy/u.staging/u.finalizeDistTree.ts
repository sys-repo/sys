import { Fs, Path, Pkg, Str, type t } from '../common.ts';
import { ensureIndexHtml } from './u.generateHtml.ts';

type Args = {
  dir: t.StringAbsoluteDir;
  filter?: (path: t.StringPath) => boolean;
  pkg?: t.Pkg;
  builder?: t.Pkg;
  buildResetToken?: string;
};

/**
 * Compute `dist.json` for every directory under a staging root (bottom-up).
 *
 * Why bottom-up:
 * - parent hashes can reuse child hashes (`trustChildDist`)
 * - deterministic, complete dist coverage for intermediate directories
 */
export async function finalizeDistTree(args: Args): Promise<void> {
  const root = Path.resolve(args.dir, '.');
  if (!(await Fs.exists(root))) return;

  const directories = await collectDirectories(root);
  for (const dir of directories) {
    await ensureIndexHtml(dir, { buildResetToken: args.buildResetToken });

    await Pkg.Dist.compute({
      dir,
      pkg: args.pkg,
      builder: args.builder,
      save: true,
      filter: args.filter,
      trustChildDist: true,
    });
  }

  // Re-finalize root after child dist coverage exists to avoid first/second-run drift.
  await ensureIndexHtml(root, {
    force: true,
    buildResetToken: args.buildResetToken,
  });
  await Pkg.Dist.compute({
    dir: root,
    pkg: args.pkg,
    builder: args.builder,
    save: true,
    filter: args.filter,
    trustChildDist: true,
  });
}

async function collectDirectories(root: string): Promise<string[]> {
  const glob = Fs.glob(root, { includeDirs: true });
  const entries = await glob.find('**/*');

  const seen = new Set<string>();
  const dirs = [root];
  for (const entry of entries) {
    if (!entry.isDirectory) continue;
    dirs.push(entry.path);
  }

  const unique: string[] = [];
  for (const dir of dirs) {
    const abs = Path.resolve(dir, '.');
    if (seen.has(abs)) continue;
    seen.add(abs);
    unique.push(abs);
  }

  return unique.toSorted(compareDeepestFirst);
}

function compareDeepestFirst(a: string, b: string): number {
  const depthA = depth(a);
  const depthB = depth(b);
  if (depthA !== depthB) return depthB - depthA;
  return Str.Compare.natural()(a, b);
}

function depth(path: string): number {
  return Str.trimSlashes(path).split('/').filter(Boolean).length;
}
