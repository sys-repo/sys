import { type t, Args } from './common.ts';
import { start } from './u.start.ts';

export const Entry: t.HttpEntryLib = {
  start,
  async entry(input) {
    const args = wrangle.args(input ?? Deno.args);
    if (args.cmd === 'start') return Entry.start(args);
  },
};

/**
 * Helpers
 */
const wrangle = {
  args(argv: string[] | t.HttpEntryArgs) {
    type T = t.HttpEntryArgs;
    return Array.isArray(argv) ? Args.parse<T>(argv) : (argv as T);
  },
} as const;
