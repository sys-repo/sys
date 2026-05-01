import { c, CliFmt, CliTable, Fs, TmplEngine, Yaml } from './common.ts';
import { Cell } from '../m.cell/mod.ts';
import type { CellTmpl } from '../m.tmpl/t.ts';
import { writeTmpl } from '../m.tmpl/u/u.write.ts';

const DescriptorPath = '-config/@sys.cell/cell.yaml';

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
  return [
    `\n  ${c.cyan('@sys/cell/cli init')}`,
    '',
    renderRows([
      ['target', formatDisplayPath(res.target)],
      ...(res.dryRun ? [['mode', 'dry-run; no files written'] as const] : []),
      ['status', status(res)],
    ]),
    '',
    TmplEngine.Log.table(res.ops, {
      actionLabel: 'kind',
      relativePathPrefix: './',
      showDryRunNote: false,
    }).trim(),
  ].join('\n');
}

async function validateExistingDescriptor(root: string) {
  const path = Fs.join(root, ...DescriptorPath.split('/'));
  if (!(await Fs.exists(path))) return;

  const read = await Fs.readText(path);
  if (!read.ok) throw read.error;

  const parsed = Yaml.parse<unknown>(read.data ?? '');
  if (parsed.error) {
    throw new Error(`Cell init: existing descriptor is invalid YAML: ${DescriptorPath}`);
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

function formatDisplayPath(path: string) {
  return CliFmt.Path.str(path);
}

function renderRows(rows: readonly (readonly [string, string])[]) {
  const table = CliTable.create([]);
  rows.forEach(([field, value]) => {
    if (!field && !value) return table.push(['', '']);
    table.push([c.gray(field), value]);
  });
  return String(table).trim();
}
