import type { t } from '../common.ts';
import { interactive, terminal } from './u.terminal.ts';

/** Predicate helpers for CLI runtime capabilities. */
export const Is: t.CliIs.Lib = {
  terminal,
  interactive,
};
