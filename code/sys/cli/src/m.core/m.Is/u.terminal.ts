import type { t } from '../common.ts';

export const terminal: t.CliIs.Lib['terminal'] = (stream) => {
  try {
    return Deno[stream].isTerminal();
  } catch {
    return false;
  }
};

export const interactive: t.CliIs.Lib['interactive'] = () => {
  return terminal('stdin') && terminal('stdout');
};
