import { type t, Cli, Cmd, ViteConfig } from './common.ts';
import { Log } from './u.log.ts';

/**
 * Create a keyboard listener to control the running dev server.
 */
export function keyboardFactory(args: {
  paths: t.ViteConfigPaths;
  port: number;
  url: string;
  pkg?: t.Pkg;
  dist?: t.DistPkg;
  dispose: () => Promise<void>;
}) {
  const { pkg, dist, paths, dispose } = args;
  const sh = Cmd.sh();
  const url = new URL(args.url).href;

  return async () => {
    const ws = await ViteConfig.workspace();

    for await (const e of Cli.keypress()) {
      /**
       * OPEN → open the local browser and point it at the dev-server.
       */
      if (e.key === 'o') {
        sh.run(`open ${url}`);
      }

      /**
       * QUIT → shutdown server and exit.
       */
      if (e.ctrlKey && e.key === 'c') {
        await dispose();
        Deno.exit(0);
      }

      /**
       * CLEAR and reset.
       */
      if (pkg && e.key === 'k') {
        console.clear();
        console.info(Log.Info.toString({ pkg, url, pad: true }));
      }

      /**
       * INFO →: <Options | ExtendedInfo>
       */
      if (pkg) {
        if (e.key === 'i') {
          console.clear();
          console.info(Log.Help.toString({ pkg, dist, paths, url, pad: false }));
        }
        if (e.key === 'i' && e.shiftKey) {
          console.clear();
          console.info(Log.Help.toString({ pkg, dist, paths, ws, url, pad: true }));
        }
      }
    }
  };
}
