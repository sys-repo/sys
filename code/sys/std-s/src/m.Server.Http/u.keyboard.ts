import { Cmd } from '../m.Process/mod.ts';
import { Cli } from './common.ts';

/**
 * Create a keyboard listener to control the running dev server.
 */
export async function keyboard(args: { port: number; dispose?: () => Promise<void> }) {
  const sh = Cmd.sh();
  for await (const e of Cli.keypress()) {
    /**
     * OPEN → open the local browser and point it at the running port.
     */
    if (e.key === 'o') {
      const url = `http://localhost:${args.port}`;
      sh.run(`open ${url}`);
    }

    /**
     * QUIT → shutdown server and exit.
     */
    if (e.ctrlKey && e.key === 'c') {
      await args.dispose?.();
      Deno.exit(0);
    }
  }
}
