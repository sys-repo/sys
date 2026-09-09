import type { t } from '../common.ts';

export type RunContext = {
  readonly input: t.CellCli.Input;
  readonly args: t.CellCli.ParsedArgs;
};
