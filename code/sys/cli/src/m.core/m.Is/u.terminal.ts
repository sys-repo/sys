import type { t } from '../common.ts';

export const terminal: t.CliIsLib['terminal'] = (stream) => {
  try {
    return Deno[stream].isTerminal();
  } catch {
    return false;
  }
};
