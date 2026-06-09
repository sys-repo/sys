import { type t, Fs, Pkg } from '../common.ts';
import { DEFAULT } from './u.fs.ts';

export const create: t.YamlConfig.File.Lib['create'] = (args) => {
  const name = args.basename;
  return {
    dir: {
      name,
      path: Fs.join(args.dir, name) as t.StringDir,
    },
  };
};

export const fromPkg: t.YamlConfig.File.Lib['fromPkg'] = (dir, pkg) => {
  return create({ dir: normalizeDir(dir), basename: Pkg.toFileNamespace(pkg) });
};

export const migrateDir: t.YamlConfig.File.Lib['migrateDir'] = async (args) => {
  const ext = args.ext ?? DEFAULT.EXT;
  const sourceDir = Fs.join(args.cwd, args.from);
  const targetDir = Fs.join(args.cwd, args.to);

  if (!(await Fs.exists(sourceDir))) return { migrated: [], skipped: [] };

  await Fs.ensureDir(targetDir);

  const migrated: Array<{ from: t.StringPath; to: t.StringPath }> = [];
  const skipped: Array<{ from: t.StringPath; to: t.StringPath }> = [];

  for await (const entry of Deno.readDir(sourceDir)) {
    if (!entry.isFile) continue;
    if (!entry.name.endsWith(ext)) continue;
    const from = Fs.join(sourceDir, entry.name);
    const to = Fs.join(targetDir, entry.name);
    if (await Fs.exists(to)) {
      skipped.push({ from, to });
      continue;
    }
    await Fs.move(from, to);
    migrated.push({ from, to });
  }

  const remaining = await countDirEntries(sourceDir);
  if (remaining === 0) {
    await Fs.remove(sourceDir);
  }

  return { migrated, skipped };
};

/**
 * Helpers:
 */
function normalizeDir(dir: t.StringDir): t.StringDir {
  const trimmed = String(dir).trim();
  if (!trimmed) throw new Error('Config dir is required.');
  const withoutTrail = trimmed.endsWith('/') ? trimmed.replace(/\/+$/, '') : trimmed;
  return withoutTrail as t.StringDir;
}

async function countDirEntries(dir: t.StringDir): Promise<number> {
  let count = 0;
  for await (const entry of Deno.readDir(dir)) {
    if (entry) count++;
  }
  return count;
}
