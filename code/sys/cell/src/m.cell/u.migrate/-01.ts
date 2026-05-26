import { type t } from '../common.ts';

type MigrateItem = { readonly from: t.StringPath; readonly to: t.StringPath };
type MigrateResult = { readonly migrated: readonly MigrateItem[]; readonly skipped: readonly MigrateItem[] };

/**
 * Migration 01:
 * - reserved for Cell descriptor shell-structure migration.
 * - intentionally no-op until the migration plan is implemented.
 */
export const migrate01 = {
  async dir(_root: t.StringDir): Promise<MigrateResult> {
    return { migrated: [], skipped: [] };
  },
} as const;
