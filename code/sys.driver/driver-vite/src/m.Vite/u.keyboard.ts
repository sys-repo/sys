import { Cmd, Denofile, keypress, type t, ViteConfig } from './common.ts';
import { Log } from './u.log.ts';

/**
 * Generates a terminal keyboard listener with common commands.
 */
export function keyboardFactory(args: {
  paths: t.ViteConfigPaths;
  port: number;
  url: string;
  ws: t.ViteDenoWorkspace;
  dispose: () => Promise<void>;
  Pkg?: t.Pkg;
}) {
  const { dispose, Pkg, paths } = args;
  const sh = Cmd.sh();
  const url = new URL(args.url);

  return async () => {
    const ws = await ViteConfig.workspace();

    for await (const e of keypress()) {
      /**
       * OPEN → open the local browser and point it at the Vite dev-server.
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
       * CLEAR → <ModuleInfo>
       */
      if (Pkg && e.key === 'c') {
        console.clear();
        console.info(Log.Info.toString({ Pkg, url: url.href, pad: true }));
      }

      /**
       * HELP → Info: <Options | ExtendedInfo>
       */
      if (Pkg && e.key === 'h') {
        console.clear();
        console.info(Log.Help.toString({ Pkg, paths, ws, url: url.href, pad: true }));
      }
    }
  };
}
