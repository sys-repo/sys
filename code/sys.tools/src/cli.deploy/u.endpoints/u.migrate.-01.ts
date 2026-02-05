import { type t, Fs, pkg } from '../common.ts';
import { YamlConfig } from '@sys/yaml/cli';
import { EndpointsFs } from './u.fs.ts';

export type MigrateResult = {
  readonly migrated: number;
  readonly skipped: number;
};

/**
 * Migrate pkg-scoped endpoint YAMLs into the flattened package root.
 */
export async function migrate01(cwd: t.StringDir): Promise<MigrateResult> {
  const legacyDir = Fs.join(cwd, `-config/${pkg.name}/deploy`);
  if (!(await Fs.exists(legacyDir))) return { migrated: 0, skipped: 0 };

  const root = YamlConfig.File.fromPkg('-config' as t.StringDir, pkg).dir.name;
  const targetDir = Fs.join(cwd, `-config/${root}.deploy`);

  await Fs.ensureDir(targetDir);

  let migrated = 0;
  let skipped = 0;

  for await (const entry of Deno.readDir(legacyDir)) {
    if (!entry.isFile) continue;
    if (!entry.name.endsWith(EndpointsFs.ext)) continue;
    const from = Fs.join(legacyDir, entry.name);
    const to = Fs.join(targetDir, entry.name);
    if (await Fs.exists(to)) {
      skipped++;
      continue;
    }
    await Fs.move(from, to);
    migrated++;
  }

  const remaining = await countDirEntries(legacyDir);
  if (remaining === 0) {
    await Fs.remove(legacyDir);
  }

  return { migrated, skipped };
}

async function countDirEntries(dir: t.StringDir): Promise<number> {
  let count = 0;
  for await (const entry of Deno.readDir(dir)) {
    if (entry) count++;
  }
  return count;
}
