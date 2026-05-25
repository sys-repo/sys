import type { t } from '../common.ts';
import { terminal } from './u.terminal.ts';

export const interactive: t.CliIsLib['interactive'] = () => {
  return terminal('stdin') && terminal('stdout');
};
