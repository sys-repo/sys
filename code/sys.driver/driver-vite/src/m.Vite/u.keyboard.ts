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
       * [Key-I]: Clear → <ModuleInfo>
       */
      if (Pkg && e.key === 'c') {
        console.clear();
        console.info(Log.Info.toString({ Pkg, url: url.href, pad: true }));
      }

      /**
       * [Key-H]: Inro → <Options | ExtendedInfo>
       */
      if (Pkg && e.key === 'h') {
        console.clear();
        console.info(Log.Help.toString({ Pkg, paths, ws, url: url.href, pad: true }));
      }
    }
  };
}
