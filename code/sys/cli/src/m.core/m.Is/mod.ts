import type { t } from '../common.ts';
import { terminal } from './u.terminal.ts';

/** Predicate helpers for CLI runtime capabilities. */
export const Is: t.CliIsLib = {
  terminal,
};
