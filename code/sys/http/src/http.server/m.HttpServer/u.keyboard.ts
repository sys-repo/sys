import { Process } from '@sys/process';
import { c } from '@sys/color/ansi';
import { Cli, Fmt } from '@sys/cli';
import { Str } from '@sys/std/str';
/**
 * Create a keyboard listener to control the running dev server.
 */
export async function keyboard(args: {
  port: number;
  url?: string;
  print?: boolean;
  exit?: boolean;
  dispose?: () => Promise<void>;
}) {
  try {
    if (!Deno.stdin.isTerminal()) return;
    if (args.print) {
      const branch = (isLast: boolean, indent = 0) => {
        const b = Fmt.Tree.branch(isLast);
        return c.gray(`${' '.repeat(indent)}${c.dim(b)}`);
      };

      const fmt = (str: string) => c.italic(c.gray(str));
      const quit = args.exit === false ? 'close server' : 'exit';
      const str = Str.builder()
        .line(c.gray('Keyboard:'))
        .line(branch(false, 1) + fmt(` ${c.white('O')}      open in browser`))
        .line(branch(true, 1) + fmt(` ${c.white('Ctrl+C')} or ${c.white('Q')} to ${quit}`))
        .line();
      console.info(String(str));
    }

    const sh = Process.sh();
    for await (const e of Cli.keypress()) {
      /**
       * OPEN → open the local browser and point it at the running port.
       */
      if (e.key === 'o') {
        const url = args.url ?? `http://localhost:${args.port}`;
        sh.run(`open ${url}`);
      }

      /**
       * QUIT → shutdown server and optionally exit.
       */
      let isQuit = false;
      if (e.ctrlKey && e.key === 'c') isQuit = true;
      if (e.key === 'q') isQuit = true;
      if (isQuit) {
        await args.dispose?.();
        if (args.exit ?? true) Deno.exit(0);
        return;
      }
    }
  } catch (error) {
    if (error instanceof Deno.errors.BadResource) return;
    if (error instanceof Error && /ENODEV|ENOTTY|No such device|Not a typewriter/i.test(error.message)) return;
    throw error;
  }
}
