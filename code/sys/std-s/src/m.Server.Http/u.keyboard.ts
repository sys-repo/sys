import { Process } from '@sys/proc';
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
    const push = (label: string, value: string) => {
      label = c.gray(` ${label}`);
      value = ` ${value}`;
      table.push([label, value]);
    };
    push('Open', `o ${c.gray(c.dim('in browser'))}`);
    push('Quit', 'ctrl + c');
    console.info(c.gray(c.dim('Keyboard')));
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
    if (e.ctrlKey && e.key === 'c') {
      await args.dispose?.();
      Deno.exit(0);
    }
  }
}
