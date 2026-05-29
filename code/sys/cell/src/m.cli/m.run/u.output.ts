import { c, type t } from '../common.ts';

export function print(text: string) {
  console.info(text);
}

export function fail(input: t.CellCli.Input, message: string, help?: string): t.CellCli.Error {
  const warning = c.yellow(`⚠ ${message}`);
  const text = help ? `${warning}${help}` : warning;
  print(text);
  return { kind: 'error', input, text, code: 1 };
}
