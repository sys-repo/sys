import { type t, Args } from './common.ts';

/** Parse CLI arguments for the static HTTP server entrypoint. */
export function parseArgs(argv: string[] = []): t.HttpServeArgs {
  return Args.parse<t.HttpServeArgs>(argv, {
    boolean: ['no-interactive'],
    string: ['dir'],
  });
}
