import { Cmd, Cli, type t, ViteConfig } from './common.ts';
import { Log } from './u.log.ts';

/**
 * Create a keyboard listener to control the running dev server.
 */
export function keyboardFactory(args: {
  paths: t.ViteConfigPaths;
  port: number;
  url: string;
  dispose: () => Promise<void>;
  pkg?: t.Pkg;
}) {
  const { dispose, pkg, paths } = args;
  const sh = Cmd.sh();
  const url = new URL(args.url);

  return async () => {
    const ws = await ViteConfig.workspace();

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

      /**
       * CLEAR and reset.
       */
      if (pkg && e.key === 'k') {
        console.clear();
        console.info(Log.Info.toString({ pkg, url: url.href, pad: true }));
      }

      /**
       * INFO →: <Options | ExtendedInfo>
       */
      if (pkg && e.key === 'i') {
        console.clear();
        console.info(Log.Help.toString({ pkg, paths, ws, url: url.href, pad: true }));
      }
    }
  };
}
