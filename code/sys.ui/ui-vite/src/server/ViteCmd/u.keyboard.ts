import { Cmd, readKeypress } from './common.ts';

/**
 * Generates a terminal keyboard listener with common commands.
 */
export function keyboardFactory(args: { port: number; url: string; dispose: () => Promise<void> }) {
  const { url, dispose } = args;
  const sh = Cmd.sh();

  return async () => {
    for await (const keypress of readKeypress()) {
      const { ctrlKey, key } = keypress;

      if (key === 'o') {
        sh.run(`open ${url}`); // Open on [o] key.
      }

      if (ctrlKey && key === 'c') {
        await dispose();
        Deno.exit(0); // Exit on [Ctrl + C].
      }
    }
  };
}
