import { CellCli } from '@sys/cell/cli';
import type { CellCli as CellCliTypes } from '@sys/cell/t';
import { pkg } from '../src/pkg.ts';

/** Builds a Cell start invocation with sys.ui-owned release provenance. */
export function startInput(args: readonly string[]): CellCliTypes.Input {
  return { argv: ['start', '.', ...args], pkg };
}

if (import.meta.main) {
  const res = await CellCli.run(startInput(Deno.args));
  if (res.kind === 'error' || res.kind === 'kill') Deno.exitCode = res.code;
}
