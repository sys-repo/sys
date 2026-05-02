import { Fs, type t } from '../common.ts';
import { PiFs } from '../../u.fs.ts';
import { ProfilesFs } from '../u.fs.ts';

type MigrateItem = { from: t.StringPath; to: t.StringPath };
type MigrateResult = { migrated: MigrateItem[]; skipped: MigrateItem[] };

const EMPTY_RESULT: MigrateResult = { migrated: [], skipped: [] };

/**
 * Migration 02:
 * - move package-owned profiles from the legacy `.pi` config dir to the canonical dir.
 */
export const migrate02 = {
  async dir(cwd: t.StringDir): Promise<MigrateResult> {
    const from = Fs.join(cwd, PiFs.legacy.configDir) as t.StringPath;
    const to = Fs.join(cwd, ProfilesFs.dir) as t.StringPath;

    if (!(await Fs.exists(from))) return { ...EMPTY_RESULT };

    const oldProfiles = await profileFiles(from);
    if (oldProfiles.length === 0) return { ...EMPTY_RESULT };

    if (!(await Fs.exists(to))) {
      await Fs.ensureDir(Fs.dirname(to));
      await Fs.move(from, to, { overwrite: false });
      return {
        migrated: oldProfiles.map((path) => ({
          from: path,
          to: rebase(path, from, to),
        })),
        skipped: [],
      };
    }

    const newProfiles = await profileFiles(to);
    const newNames = new Set(newProfiles.map((path) => Fs.basename(path)));
    const conflicts = oldProfiles.filter((path) => newNames.has(Fs.basename(path)));
    if (conflicts.length > 0) {
      const names = conflicts.map((path) => Fs.basename(path)).sort().join(', ');
      throw new Error(
        `Profile config migration would overwrite existing profile(s): ${names}. ` +
          `Move or remove conflicts between ${PiFs.legacy.configDir} and ${ProfilesFs.dir}.`,
      );
    }

    const migrated: MigrateItem[] = [];
    for (const path of oldProfiles) {
      const target = rebase(path, from, to);
      await Fs.ensureDir(Fs.dirname(target));
      await Fs.move(path, target, { overwrite: false });
      migrated.push({ from: path, to: target });
    }

    await removeIfEmpty(from);
    return { migrated, skipped: [] };
  },
} as const;

async function profileFiles(dir: t.StringPath) {
  const files = await Fs.glob(dir, { includeDirs: false }).find(`*${ProfilesFs.ext}`);
  return files.map((entry) => entry.path as t.StringPath).sort();
}

function rebase(path: t.StringPath, from: t.StringPath, to: t.StringPath) {
  const suffix = path.slice(from.length).replace(/^\//, '');
  return Fs.join(to, suffix) as t.StringPath;
}

async function removeIfEmpty(dir: t.StringPath) {
  const remaining = await Fs.glob(dir, { includeDirs: true }).find('*');
  if (remaining.length === 0) await Fs.remove(dir);
}
