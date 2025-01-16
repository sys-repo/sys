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
    const table = Cli.table([]);
    const push = (keyCommand: string, description: string) => {
      description = c.gray(` ${description}`);
      keyCommand = `  ${keyCommand}`;
      table.push([keyCommand, description]);
    };
    push(`${c.bold('o')}`, `Open ${c.green('in browser')}`);
    push(c.bold('q'), 'Quit');
    push(c.bold('ctrl + c'), 'Quit');

    console.info(c.gray('Keyboard'));
    console.info(table.toString());
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
