import { Process } from '@sys/process';
import { Cli, c } from './common.ts';

/**
 * Create a keyboard listener to control the running dev server.
 */
export async function keyboard(args: {
  port: number;
  print?: boolean;
  dispose?: () => Promise<void>;
}) {
  if (args.print) {
    const table = Cli.table(['Keyboard']);
    const push = (description: string, keyCommand: string) => {
      description = c.gray(` ${description}`);
      table.push([description, keyCommand]);
    };
    push(`Open`, `O ${c.italic(c.gray('(in browser)'))}`);
    push('Quit ', `Ctrl+C ${c.gray('or')} Q`);

    console.info(table.toString().trim());
    console.info();
  }

  const sh = Process.sh();
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
    let isQuit = false;
    if (e.ctrlKey && e.key === 'c') isQuit = true;
    if (e.key === 'q') isQuit = true;
    if (isQuit) {
      await args.dispose?.();
      Deno.exit(0);
    }
  }
}
