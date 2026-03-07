import { Process } from '@sys/process';
import { c, Cli, Fmt, Str } from './common.ts';

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

    const fmt = (str: string) => c.italic(c.gray(str));
    const str = Str.builder()
      .line(c.gray('Keyboard:'))
      .line(branch(false, 1) + fmt(` ${c.white('O')}      open in browser`))
      .line(branch(true, 1) + fmt(` ${c.white('Ctrl+C')} or ${c.white('Q')} to exit`))
      .line();
    console.info(String(str));
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
