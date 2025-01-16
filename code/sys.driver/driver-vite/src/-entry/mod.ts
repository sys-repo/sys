import { type t, Args, ViteLog } from './common.ts';
import { dev } from './u.dev.ts';
import { serve } from './u.serve.ts';

export const Entry: t.ViteEntryLib = {
  dev,
  serve,

  async entry(input) {
    const args = wrangle.args(input ?? Deno.args);

    /**
     * Start HMR development server.
     */
    if (args.cmd === 'dev') {
      ViteLog.UsageAPI.log({ cmd: 'dev' });
      return await Entry.dev(args);
    }

    if (args.cmd === 'serve') {
      ViteLog.UsageAPI.log({ cmd: 'serve' });
      return Entry.serve(args);
    }
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
