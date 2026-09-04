import { Is, Num, type t } from './common.ts';

export function resolveServeHost(value: unknown, owner: string): t.ServeTool.Host {
  if (value === undefined || value === '') return 'local';
  if (value === 'local' || value === 'network') return value;
  throw new Error(`${owner}: invalid host value: ${String(value)}. Use "local" or "network".`);
}

export function resolveServePort(value: unknown, owner: string): number | undefined {
  if (value === undefined) return undefined;
  if (!Is.num(value) || value < 0 || value > 65535 || !Num.Is.int(value)) {
    throw new Error(`${owner}: invalid port value: ${String(value)}.`);
  }
  return value;
}
