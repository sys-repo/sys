import { type t, Args } from './common.ts';
import { serve } from './u.serve.ts';

export const Entry: t.ViteEntryLib = {
  serve,
  async entry(input) {
    const args = wrangle.args(input ?? Deno.args);
    if (args.cmd === 'serve') return Entry.serve(args);
  },
};

/**
 * Helpers
 */
const wrangle = {
  args(argv: string[] | t.ViteEntryArgs) {
    type T = t.ViteEntryArgs;
    return Array.isArray(argv) ? Args.parse<T>(argv) : (argv as T);
  },
} as const;
