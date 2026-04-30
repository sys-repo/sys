import { Fs, Yaml } from './common.ts';
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
  const lines = ['@sys/cell/cli init', ''];
  lines.push(`target  ${res.target}`);
  if (res.dryRun) lines.push('mode    dry-run; no files written');
  lines.push(`status  ${status(res)}`);
  lines.push('');

  const rows = res.ops.map((op) => [formatKind(op), formatPath(op)] as const);
  const width = Math.max(...rows.map(([kind]) => kind.length));
  for (const [kind, path] of rows) lines.push(`${kind.padEnd(width)}  ${path}`);

  return lines.join('\n');
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

function formatKind(op: CellTmpl.Write.Op) {
  if (!op.dryRun) return op.kind;
  if (op.kind === 'skip') return 'skip';
  return `would ${op.kind}`;
}

function formatPath(op: CellTmpl.Write.Op) {
  const reason = op.kind === 'skip' ? op.reason : undefined;
  return reason ? `${op.path} (${reason})` : op.path;
}
