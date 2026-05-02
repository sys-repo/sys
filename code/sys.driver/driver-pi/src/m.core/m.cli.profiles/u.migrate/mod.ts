import { type t } from '../common.ts';
import { migrate01 } from './-01.ts';
import { migrate02 } from './-02.ts';

type MigrateItem = { from: t.StringPath; to: t.StringPath };
export type ProfileMigrateResult = { migrated: MigrateItem[]; skipped: MigrateItem[] };

export const ProfileMigrate = {
  async dir(cwd: t.StringDir): Promise<ProfileMigrateResult> {
    const moved = await migrate02.dir(cwd);
    const normalized = await migrate01.dir(cwd);
    return changed(moved, normalized);
  },

  async file(path: t.StringPath): Promise<ProfileMigrateResult> {
    return combine(await migrate01.file(path));
  },

  message(result: ProfileMigrateResult): string | undefined {
    const count = result.migrated.length;
    if (count === 0) return undefined;
    const noun = count === 1 ? 'config' : 'configs';
    return `Migrated ${count} Pi profile ${noun}.`;
  },
} as const;

function changed(...results: readonly ProfileMigrateResult[]): ProfileMigrateResult {
  return {
    migrated: results.flatMap((result) => result.migrated),
    skipped: [],
  };
}

function combine(...results: readonly ProfileMigrateResult[]): ProfileMigrateResult {
  return {
    migrated: results.flatMap((result) => result.migrated),
    skipped: results.flatMap((result) => result.skipped),
  };
}
