import { Process } from '@sys/process';
import { Cli, Fmt, c } from './common.ts';

/**
 * Create a keyboard listener to control the running dev server.
 */
export async function keyboard(args: {
  port: number;
  print?: boolean;
  dispose?: () => Promise<void>;
}) {
  if (args.print) {
    const branch = (isLast: boolean, indent = 0) => {
      const b = Fmt.Tree.branch(isLast);
      return c.gray(`${' '.repeat(indent)}${c.dim(b)}`);
    };
    console.info(c.gray('Keyboard:'));
    console.info(branch(false, 1), c.gray(`${c.white('O')} ${c.italic('(in browser)')}`));
    console.info(branch(true, 1), c.gray(`${c.white('Ctrl+C')} or ${c.white('Q')} to exist`));
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
