import { c, CliTable, Fs, Str, TmplEngine, Yaml } from './common.ts';
import { Cell } from '../m.cell/mod.ts';
import { CellMigrate } from '../m.cell/u.migrate/mod.ts';
import { CellPaths } from '../m.cell/u.paths.ts';
import { FmtPath } from './u.fmt.path.ts';
import type { CellTmpl } from '../m.tmpl/t.ts';
import { writeTmpl } from '../m.tmpl/u/u.write.ts';

type InitCellOptions = {
  readonly dir?: string;
  readonly dryRun?: boolean;
};

export type InitCellResult = {
  readonly target: string;
  readonly dryRun: boolean;
  readonly ops: readonly CellTmpl.Write.Op[];
  readonly total: CellTmpl.Write.Result['total'];
  readonly already: boolean;
};

export async function initCell(options: InitCellOptions = {}): Promise<InitCellResult> {
  const target = Fs.resolve(options.dir ?? '.');
  const dryRun = options.dryRun === true;

  if (!dryRun) await CellMigrate.dir(target);
  await validateExistingDescriptor(target);

  const res = await writeTmpl('default', target, { dryRun });
  const already = res.ops.length > 0 && res.ops.every((op) => op.kind === 'skip');

  return {
    target: res.target,
    dryRun,
    ops: res.ops,
    total: res.total,
    already,
  };
}

export function formatInitResult(res: InitCellResult) {
  const rows = renderRows([
    ['target', FmtPath.display(res.target)],
    ...(res.dryRun ? [['mode', 'dry-run; no files written'] as const] : []),
    ['status', status(res)],
  ]);
  const ops = TmplEngine.Log.table(res.ops, { preset: 'plan' }).trim();

  return Str.dedent(`
    ${c.cyan('@sys/cell/cli init')}

    ${rows}

    ${ops}
  `).trimEnd();
}

async function validateExistingDescriptor(root: string) {
  const canonical = CellPaths.descriptor;
  const legacy = CellPaths.legacy.descriptor;
  const canonicalPath = Fs.join(root, canonical);
  const legacyPath = Fs.join(root, legacy);
  const [hasCanonical, hasLegacy] = await Promise.all([
    Fs.exists(canonicalPath),
    Fs.exists(legacyPath),
  ]);

  if (hasCanonical && hasLegacy) {
    throw new Error(
      `Cell init: multiple descriptors found: ${canonical}; ${legacy}. Resolve the descriptor conflict before initializing.`,
    );
  }

  if (hasCanonical) return validateDescriptor(canonical, canonicalPath);

  if (hasLegacy) {
    await validateDescriptor(legacy, legacyPath);
    throw new Error(
      `Cell init: existing legacy descriptor found: ${legacy}. Move it to ${canonical} before initializing.`,
    );
  }
}

async function validateDescriptor(descriptor: string, path: string) {
  const read = await Fs.readText(path);
  if (!read.ok) throw read.error;

  const parsed = Yaml.parse<unknown>(read.data ?? '');
  if (parsed.error) {
    throw new Error(`Cell init: existing descriptor is invalid YAML: ${descriptor}`);
  }

  const validation = Cell.Schema.Descriptor.validate(parsed.data);
  if (!validation.ok) {
    const message = validation.errors.map((e) => `${e.path}: ${e.message}`).join('; ');
    throw new Error(`Cell init: existing descriptor is invalid: ${message}`);
  }
}

function status(res: InitCellResult) {
  if (res.already) return 'already initialized';
  return res.dryRun ? 'would initialize' : 'initialized';
}

function renderRows(rows: readonly (readonly [string, string])[]) {
  const table = CliTable.create([]);
  rows.forEach(([field, value]) => {
    if (!field && !value) return table.push(['', '']);
    table.push([c.gray(field), value]);
  });
  return String(table).trim();
}
