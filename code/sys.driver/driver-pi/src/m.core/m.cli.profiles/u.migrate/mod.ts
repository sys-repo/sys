import { type t } from '../common.ts';
import { migrate01 } from './-01.ts';
import { migrate02 } from './-02.ts';
import { migrate03 } from './-03.ts';
import { migrate04 } from './-04.ts';

type MigrateItem = { from: t.StringPath; to: t.StringPath };
export type ProfileMigrateResult = { migrated: MigrateItem[]; skipped: MigrateItem[] };

export const ProfileMigrate = {
  async dir(cwd: t.StringDir): Promise<ProfileMigrateResult> {
    const movedProfiles = await migrate02.dir(cwd);
    const movedLogs = await migrate03.dir(cwd);
    const normalized = await migrate01.dir(cwd);
    const toolDefaults = await migrate04.dir(cwd);
    return changed(movedProfiles, movedLogs, normalized, toolDefaults);
  },

  async file(path: t.StringPath): Promise<ProfileMigrateResult> {
    return combine(await migrate01.file(path), await migrate04.file(path));
  },

  message(result: ProfileMigrateResult): string | undefined {
    const count = result.migrated.length;
    if (count === 0) return undefined;
    const noun = count === 1 ? 'item' : 'items';
    return `Migrated ${count} Pi config/runtime ${noun}.`;
  },
} as const;

function changed(...results: readonly ProfileMigrateResult[]): ProfileMigrateResult {
  return {
    migrated: uniqueItems(results.flatMap((result) => result.migrated)),
    skipped: [],
  };
}

function combine(...results: readonly ProfileMigrateResult[]): ProfileMigrateResult {
  const migrated = uniqueItems(results.flatMap((result) => result.migrated));
  const migratedKeys = new Set(migrated.map(itemKey));
  const skipped = uniqueItems(results.flatMap((result) => result.skipped)).filter(
    (item) => !migratedKeys.has(itemKey(item)),
  );
  return { migrated, skipped };
}

function uniqueItems(items: readonly MigrateItem[]) {
  const seen = new Set<string>();
  const next: MigrateItem[] = [];
  for (const item of items) {
    const key = itemKey(item);
    if (seen.has(key)) continue;
    seen.add(key);
    next.push(item);
  }
  return next;
}

function itemKey(item: MigrateItem) {
  return `${item.from}\n${item.to}`;
}
