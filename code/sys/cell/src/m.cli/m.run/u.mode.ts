import { isServiceMode } from '../../m.cell/u.services/u.plan.ts';
import { Is, type t } from '../common.ts';

type ServiceModeResult =
  | { readonly ok: true; readonly value?: t.Cell.Services.ServiceMode }
  | { readonly ok: false; readonly message: string };

export function serviceModeFlag(
  value: t.CellCli.ParsedArgs['mode'],
  command: 'start' | 'kill',
): ServiceModeResult {
  if (value === undefined) return { ok: true };
  if (Is.array<string | boolean>(value)) {
    return { ok: false, message: `Repeated option for ${command}: --mode` };
  }
  if (!Is.str(value) || value.length === 0) {
    return { ok: false, message: 'Option requires a value: --mode' };
  }
  if (!isServiceMode(value)) {
    return { ok: false, message: `Invalid ${command} mode: '${value}'` };
  }
  return { ok: true, value };
}
