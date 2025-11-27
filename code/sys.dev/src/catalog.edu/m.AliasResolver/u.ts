import { Is } from './common.ts';

type O = Record<string, unknown>;

export function ensureIsObject(input?: O): O {
  if (!input) return {};
  if (!Is.record(input)) return {};
  return input;
}
