import { type t, Fs } from '../common.ts';
import { EndpointsFs } from './u.fs.ts';

const LEGACY_DIRS = ['-endpoints', '-config/deploy'] as const;

export type MigrateResult = {
  readonly migrated: number;
  readonly skipped: number;
};

/**
 * Migration helpers for moving legacy endpoint YAMLs into the pkg-scoped dir.
 */
export const EndpointsMigrate = {
  async run(cwd: t.StringDir): Promise<MigrateResult> {
    const targetDir = Fs.join(cwd, EndpointsFs.dir);
    let migrated = 0;
    let skipped = 0;

    for (const legacy of LEGACY_DIRS) {
      const sourceDir = Fs.join(cwd, legacy);
      if (!(await Fs.exists(sourceDir))) continue;

      await Fs.ensureDir(targetDir);

      for await (const entry of Deno.readDir(sourceDir)) {
        if (!entry.isFile) continue;
        if (!entry.name.endsWith(EndpointsFs.ext)) continue;
        const from = Fs.join(sourceDir, entry.name);
        const to = Fs.join(targetDir, entry.name);
        if (await Fs.exists(to)) {
          skipped++;
          continue;
        }
        await Fs.move(from, to);
        migrated++;
      }

      const remaining = await countDirEntries(sourceDir);
      if (remaining === 0) {
        await Fs.remove(sourceDir);
      }
    }

    return { migrated, skipped };
  },
} as const;

async function countDirEntries(dir: t.StringDir): Promise<number> {
  let count = 0;
  for await (const entry of Deno.readDir(dir)) {
    if (entry) count++;
  }
  return count;
}
