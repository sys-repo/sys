import { Cell } from '../m.cell/mod.ts';
import { c, CliTable, Str, type t } from './common.ts';

export type StartCellArgs = {
  readonly dir?: string;
};

export type StartCellResult = {
  readonly root: string;
  readonly services: number;
};

export async function startCell(args: StartCellArgs = {}): Promise<StartCellResult> {
  const cell = await Cell.load(args.dir ?? '.');
  const runtime = await Cell.Runtime.start(cell);

  try {
    await Cell.Runtime.wait(runtime);
  } finally {
    await runtime.close('cell.start.finished');
  }

  return {
    root: cell.root,
    services: runtime.services.length,
  };
}

export function formatStartResult(res: StartCellResult): string {
  const table = CliTable.create([]);
  table.push([c.gray('root'), c.white(res.root)]);
  table.push([c.gray('services'), c.white(String(res.services))]);
  return Str.trimEdgeNewlines(String(table));
}

export function toStartResult(
  input: t.CellCli.Input,
  res: StartCellResult,
): t.CellCli.Start.Result {
  return {
    kind: 'start',
    input,
    text: formatStartResult(res),
    root: res.root,
    services: res.services,
  };
}
