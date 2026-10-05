import { CellMigrate, type CellMigrateItem } from '../../m.cell/u.migrate/mod.ts';
import { c, CliTable, Fs, Str } from '../common.ts';
import { FmtPath } from '../u.fmt/u.path.ts';

type MigrateCellOptions = {
  readonly dir?: string;
  readonly dryRun?: boolean;
};

export type MigrateCellResult = {
  readonly target: string;
  readonly dryRun: boolean;
  readonly planned: readonly CellMigrateItem[];
  readonly migrated: readonly CellMigrateItem[];
  readonly skipped: readonly CellMigrateItem[];
};

export async function migrateCell(options: MigrateCellOptions = {}): Promise<MigrateCellResult> {
  const target = Fs.resolve(options.dir ?? '.');
  const dryRun = options.dryRun === true;
  const res = await CellMigrate.dir(target, { dryRun });

  return { target, dryRun, planned: res.planned, migrated: res.migrated, skipped: res.skipped };
}

export function formatMigrateResult(res: MigrateCellResult) {
  const rows = renderRows([
    ['target', FmtPath.display(res.target)],
    ...(res.dryRun ? [['mode', 'dry-run; no files moved'] as const] : []),
    ['status', status(res)],
  ]);
  const ops = renderOps(res);

  return Str.dedent(`
    ${c.cyan('@sys/cell/cli migrate')}

    ${rows}

    ${ops}
  `).trimEnd();
}

/**
 * Helpers:
 */

function status(res: MigrateCellResult) {
  if (res.planned.length > 0) return 'would migrate';
  if (res.migrated.length > 0) return 'migrated';
  return 'nothing to migrate';
}

function renderOps(res: MigrateCellResult) {
  const rows: [string, string, string][] = [];
  append(rows, 'plan', res.planned);
  append(rows, 'move', res.migrated);
  append(rows, 'skip', res.skipped);

  if (rows.length === 0) return c.gray('no migration operations');

  const table = CliTable.create([]);
  rows.forEach(([kind, path, reason]) => table.push([c.gray(kind), path, reason]));
  return String(table).trim();
}

function append(rows: [string, string, string][], kind: string, items: readonly CellMigrateItem[]) {
  items.forEach((item) => {
    const path = `${FmtPath.display(item.from)} → ${FmtPath.display(item.to)}`;
    rows.push([kind, path, item.reason ?? '']);
  });
}

function renderRows(rows: readonly (readonly [string, string])[]) {
  const table = CliTable.create([]);
  rows.forEach(([field, value]) => table.push([c.gray(field), value]));
  return String(table).trim();
}
