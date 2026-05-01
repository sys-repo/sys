import { type t } from '../common.ts';
import { migrate01 } from './-01.ts';

type MigrateItem = { from: t.StringPath; to: t.StringPath };
export type ProfileMigrateResult = { migrated: MigrateItem[]; skipped: MigrateItem[] };

export const ProfileMigrate = {
  async dir(cwd: t.StringDir): Promise<ProfileMigrateResult> {
    return combine(await migrate01.dir(cwd));
  },

  async file(path: t.StringPath): Promise<ProfileMigrateResult> {
    return combine(await migrate01.file(path));
  },
} as const;

function combine(...results: readonly ProfileMigrateResult[]): ProfileMigrateResult {
  return {
    migrated: results.flatMap((result) => result.migrated),
    skipped: results.flatMap((result) => result.skipped),
  };
}
