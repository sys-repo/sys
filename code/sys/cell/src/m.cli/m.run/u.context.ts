import type { t } from '../common.ts';

export type RunContext = {
  readonly argv: readonly string[];
  readonly args: t.CellCli.ParsedArgs;
};
