import { Is, type t } from '../common.ts';

type ReporterResult =
  | { readonly ok: true; readonly value: t.CellCli.Start.ReporterMode }
  | { readonly ok: false; readonly message: string };

export function startReporterFlag(
  value: t.CellCli.ParsedArgs['reporter'],
): ReporterResult {
  if (value === undefined) return { ok: true, value: 'auto' };
  if (Is.array<string | boolean>(value)) {
    return { ok: false, message: 'Repeated option for start: --reporter' };
  }
  if (!Is.str(value) || value.length === 0) {
    return { ok: false, message: 'Option requires a value: --reporter' };
  }
  if (value !== 'auto' && value !== 'screen' && value !== 'raw') {
    return { ok: false, message: `Invalid start reporter: '${value}'` };
  }
  return { ok: true, value };
}
