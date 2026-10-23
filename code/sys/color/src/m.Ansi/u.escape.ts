import type { t } from './common.ts';

/** Raw ANSI escape sequences used by terminal color formatters. */
export const escape: t.AnsiColor.Escape = Object.freeze(
  {
    reset: '\x1b[0m',
    italic: '\x1b[3m',
    bold: '\x1b[1m',
    underline: '\x1b[4m',
  } as const,
);
