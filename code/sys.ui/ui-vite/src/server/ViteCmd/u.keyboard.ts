import { Cmd, keypress } from './common.ts';

/**
 * Generates a terminal keyboard listener with common commands.
 */
export function keyboardFactory(args: { port: number; url: string; dispose: () => Promise<void> }) {
  const { url, dispose } = args;
  const sh = Cmd.sh();

  return async () => {
    for await (const e of keypress()) {
      /**
       * [O] → open the server in the local browser.
       */
      if (e.key === 'o') {
        sh.run(`open ${url}`);
      }

      /**
       * [Ctrl + C] → shutdown server and exit.
       */
      if (e.ctrlKey && e.key === 'c') {
        await dispose();
        Deno.exit(0);
      }
    }
  };
}
