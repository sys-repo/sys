import type { t } from '../common.ts';

/** Predicate helpers for CLI runtime capabilities. */
export type CliIsLib = {
  /** True when the named standard stream is attached to a terminal. */
  readonly terminal: (stream: t.StdioName) => boolean;

  /** True when stdin and stdout are both attached to terminals. */
  readonly interactive: () => boolean;
};
