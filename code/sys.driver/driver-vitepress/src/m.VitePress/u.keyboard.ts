import { Cli, Cmd, type t } from './common.ts';

/**
 * Create a keyboard listener to control the running dev server.
 */
export function keyboardFactory(args: {
  port: number;
  url: string;
  dispose: () => Promise<void>;
  pkg?: t.Pkg;
}) {
  const { dispose } = args;
  const url = new URL(args.url);
  const sh = Cmd.sh();

  return async () => {
    for await (const e of Cli.keypress()) {
      /**
       * OPEN → open the local browser and point it at the dev-server.
       */
      if (e.key === 'o') {
        sh.run(`open ${url.href}`);
      }

      /**
       * QUIT → shutdown server and exit.
       */
      if (e.ctrlKey && e.key === 'c') {
        await dispose();
        Deno.exit(0);
      }
    }
  };
}
