import { c, Cli, Process, Str } from './common.ts';
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
    const sh = Process.sh();
    const handle = Cli.Keyboard.bind({
      exit: args.exit ?? true,
      onQuit: async () => void await args.dispose?.(),
      onKey(e) {
        if (e.key !== 'o') return;
        const url = args.url ?? `http://localhost:${args.port}`;
        sh.run(`open ${url}`);
      },
    });
    if (!handle) return;

    if (args.print) {
      const branch = (isLast: boolean, indent = 0) => {
        const b = Cli.Fmt.Tree.branch(isLast);
        return c.gray(`${' '.repeat(indent)}${c.dim(b)}`);
      };

      const fmt = (str: string) => c.gray(str);
      const str = Str.builder()
        .line(c.gray('keyboard:'))
        .line(branch(false, 1) + fmt(` ${c.white('O')} open in browser`))
        .line(branch(true, 1) + fmt(` ${c.white('Ctrl+C')} or ${c.white('Q')} to quit`))
        .line();
      console.info(String(str));
    }

    await handle.finished;
  } catch (error) {
    if (Cli.Keyboard.isUnavailableError(error)) return;
    throw error;
  }
}
