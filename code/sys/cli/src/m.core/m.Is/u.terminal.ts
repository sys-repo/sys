import type { t } from '../common.ts';

export const terminal: t.CliIsLib['terminal'] = (stream) => {
  try {
    return Deno[stream].isTerminal();
  } catch {
    return false;
  }
};

export const interactive: t.CliIsLib['interactive'] = () => {
  return terminal('stdin') && terminal('stdout');
};
