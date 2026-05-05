import { PiFs } from '../../u.fs.ts';
import { Fs, type t } from '../common.ts';

type MigrateItem = { from: t.StringPath; to: t.StringPath };
type MigrateResult = { migrated: MigrateItem[]; skipped: MigrateItem[] };

const EMPTY_RESULT: MigrateResult = { migrated: [], skipped: [] };
const LEGACY_LOG_DIRS = [`.log/${PiFs.root}`, `.log/${PiFs.root}.pi`] as const;

/**
 * Migration 03:
 * - move legacy wrapper-owned sandbox logs under `.pi/@sys/log`.
 */
export const migrate03 = {
  async dir(cwd: t.StringDir): Promise<MigrateResult> {
    const to = Fs.join(cwd, PiFs.logDir) as t.StringPath;
    const migrated: MigrateItem[] = [];

    for (const dir of LEGACY_LOG_DIRS) {
      const from = Fs.join(cwd, dir) as t.StringPath;
      migrated.push(...(await migrateLogDir(from, to)));
    }

    await removeIfEmpty(Fs.join(cwd, '.log') as t.StringPath);
    if (migrated.length === 0) return { ...EMPTY_RESULT };
    return { migrated, skipped: [] };
  },
} as const;

/**
 * Helpers:
 */

async function migrateLogDir(from: t.StringPath, to: t.StringPath): Promise<MigrateItem[]> {
  if (!(await Fs.exists(from))) return [];

  const files = await Fs.glob(from, { includeDirs: false }).find('**/*');
  if (files.length === 0) {
    await Fs.remove(from);
    return [];
  }

  for (const file of files) {
    const target = rebase(file.path as t.StringPath, from, to);
    if (await Fs.exists(target)) {
      const err = `Pi runtime log migration would overwrite existing file: ${Fs.trimCwd(target)}.`;
      throw new Error(err);
    }
  }

  const migrated: MigrateItem[] = [];
  for (const file of files) {
    const source = file.path as t.StringPath;
    const target = rebase(source, from, to);
    await Fs.ensureDir(Fs.dirname(target));
    await Fs.move(source, target, { overwrite: false });
    migrated.push({ from: source, to: target });
  }

  await removeIfNoFiles(from);
  return migrated;
}

function rebase(path: t.StringPath, from: t.StringPath, to: t.StringPath) {
  const suffix = path.slice(from.length).replace(/^\//, '');
  return Fs.join(to, suffix) as t.StringPath;
}

async function removeIfEmpty(dir: t.StringPath) {
  if (!(await Fs.exists(dir))) return;
  const remaining = await Fs.glob(dir, { includeDirs: true }).find('*');
  if (remaining.length === 0) await Fs.remove(dir);
}

async function removeIfNoFiles(dir: t.StringPath) {
  if (!(await Fs.exists(dir))) return;
  const remaining = await Fs.glob(dir, { includeDirs: false }).find('**/*');
  if (remaining.length === 0) await Fs.remove(dir);
}
