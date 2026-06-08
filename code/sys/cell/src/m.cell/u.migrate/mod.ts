import { type t } from '../common.ts';
import { migrate01 } from './-01.ts';

export type CellMigrateOptions = { readonly dryRun?: boolean };
export type CellMigrateItem = {
  readonly from: t.StringPath;
  readonly to: t.StringPath;
  readonly reason?: string;
};
export type CellMigrateResult = {
  readonly planned: readonly CellMigrateItem[];
  readonly migrated: readonly CellMigrateItem[];
  readonly skipped: readonly CellMigrateItem[];
};

/**
 * Cell descriptor/config migration spine.
 */
export const CellMigrate = {
  async dir(root: t.StringDir, options: CellMigrateOptions = {}): Promise<CellMigrateResult> {
    return combine(await migrate01.dir(root, options));
  },

  message(result: CellMigrateResult): string | undefined {
    const planned = result.planned.length;
    if (planned > 0) {
      const noun = planned === 1 ? 'item' : 'items';
      return `Would migrate ${planned} Cell config/runtime ${noun}.`;
    }

    const migrated = result.migrated.length;
    if (migrated > 0) {
      const noun = migrated === 1 ? 'item' : 'items';
      return `Migrated ${migrated} Cell config/runtime ${noun}.`;
    }

    return undefined;
  },
} as const;

/**
 * Helpers:
 */

function combine(...results: readonly CellMigrateResult[]): CellMigrateResult {
  const planned = uniqueItems(results.flatMap((result) => result.planned));
  const migrated = uniqueItems(results.flatMap((result) => result.migrated));
  const changedKeys = new Set([...planned, ...migrated].map(itemKey));
  const skipped = uniqueItems(results.flatMap((result) => result.skipped)).filter(
    (item) => !changedKeys.has(itemKey(item)),
  );

  return { planned, migrated, skipped };
}

function uniqueItems(items: readonly CellMigrateItem[]) {
  const seen = new Set<string>();
  const next: CellMigrateItem[] = [];
  for (const item of items) {
    const key = itemKey(item);
    if (seen.has(key)) continue;
    seen.add(key);
    next.push(item);
  }
  return next;
}

function itemKey(item: CellMigrateItem) {
  return `${item.from}\n${item.to}`;
}
