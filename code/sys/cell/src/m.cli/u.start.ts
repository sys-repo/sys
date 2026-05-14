import { Cell } from '../m.cell/mod.ts';
import { c, CliTable, Str, type t } from './common.ts';
import { createShutdownSignal, isSignalShutdownReason } from './u.shutdown.ts';

export type StartCellArgs = {
  readonly dir?: string;
};

export type StartCellResult = {
  readonly root: string;
  readonly services: number;
};

export async function startCell(args: StartCellArgs = {}): Promise<StartCellResult> {
  const cell = await Cell.load(args.dir);
  const shutdown = createShutdownSignal();
  let started: t.Cell.Services.Started | undefined;
  let finalReason: string | undefined;

  try {
    started = await Cell.start(cell, { until: shutdown.signal });
    await Promise.race([Cell.Services.wait(started), shutdown.done]);
  } finally {
    try {
      await started?.close(shutdown.reason ?? 'cell.start.finished');
    } finally {
      finalReason = shutdown.reason;
      shutdown.dispose();
    }
  }

  if (isSignalShutdownReason(finalReason)) Deno.exitCode = 130;

  return {
    root: cell.root,
    services: started?.services.length ?? 0,
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
