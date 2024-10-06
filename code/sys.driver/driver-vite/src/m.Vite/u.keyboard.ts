import { Cmd, keypress, type t } from './common.ts';
import { Log } from './u.log.ts';

/**
 * Generates a terminal keyboard listener with common commands.
 */
export function keyboardFactory(args: {
  paths: t.ViteConfigPaths;
  port: number;
  url: string;
  dispose: () => Promise<void>;
  Pkg?: t.Pkg;
}) {
  const { dispose, Pkg, paths } = args;
  const sh = Cmd.sh();
  const url = new URL(args.url);

  return async () => {
    for await (const e of keypress()) {
      /**
       * [Key-O] → open the server in the local browser.
       */
      if (e.key === 'o') {
        sh.run(`open ${url.href}`);
      }

      /**
       * [Ctrl + C] → shutdown server and exit.
       */
      if (e.ctrlKey && e.key === 'c') {
        await dispose();
        Deno.exit(0);
      }

      /**
       * [Key-I]: Info
       */
      if (Pkg && e.key === 'i') {
        console.clear();
        console.info(Log.Info.toString({ Pkg, paths, url: url.href, pad: true }));
      }
    }
  };
}
