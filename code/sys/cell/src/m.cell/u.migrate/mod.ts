import { type t } from '../common.ts';
import { migrate01 } from './-01.ts';

export type CellMigrateItem = { readonly from: t.StringPath; readonly to: t.StringPath };
export type CellMigrateResult = {
  readonly migrated: readonly CellMigrateItem[];
  readonly skipped: readonly CellMigrateItem[];
};

/**
 * Cell metadata/control migration spine.
 */
export const CellMigrate = {
  async dir(root: t.StringDir): Promise<CellMigrateResult> {
    return combine(await migrate01.dir(root));
  },

  message(result: CellMigrateResult): string | undefined {
    const count = result.migrated.length;
    if (count === 0) return undefined;
    const noun = count === 1 ? 'item' : 'items';
    return `Migrated ${count} Cell config/runtime ${noun}.`;
  },
} as const;

/**
 * Helpers:
 */

function combine(...results: readonly CellMigrateResult[]): CellMigrateResult {
  return {
    migrated: uniqueItems(results.flatMap((result) => result.migrated)),
    skipped: uniqueItems(results.flatMap((result) => result.skipped)),
  };
}

function uniqueItems(items: readonly CellMigrateItem[]) {
  const seen = new Set<string>();
  const next: CellMigrateItem[] = [];
  for (const item of items) {
    const key = `${item.from}\n${item.to}`;
    if (seen.has(key)) continue;
    seen.add(key);
    next.push(item);
  }
  return next;
}
