import { type t, Args } from './common.ts';

export const Entry: t.HttpEntryLib = {
  async entry(input) {
    const args = wrangle.args(input ?? Deno.args);
    if (args.cmd === 'start') return Entry.start(args);
  },

  async start(args) {
    if (args.cmd !== 'start') return;
    const { port = 8080 } = args;

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
