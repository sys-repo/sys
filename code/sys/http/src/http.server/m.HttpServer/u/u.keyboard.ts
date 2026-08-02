import { c, Cli, Process, Str } from '../common.ts';

type Args = {
  port: number;
  url?: string;
  print?: boolean;
  exit?: boolean;
  dispose?: () => Promise<void>;
  until?: PromiseLike<unknown>;
};

/**
 * Create a keyboard listener to control the running dev server.
 */
export async function keyboard(args: Args) {
  const handle = bind(args);
  if (!handle) return;
  await handle.finished;
}

/**
 * Bind keyboard controls and report whether terminal binding is active.
 */
export function bindKeyboard(args: Args): boolean {
  const handle = bind(args);
  if (!handle) return false;

  void handle.finished.catch((error: unknown) => {
    if (!Cli.Keyboard.isUnavailableError(error)) console.warn(error);
  });
  return true;
}

/**
 * Helpers:
 */
function bind(args: Args): ReturnType<typeof Cli.Keyboard.bind> {
  try {
    const sh = Process.sh();
    const handle = Cli.Keyboard.bind({
      exit: args.exit ?? true,
      until: args.until,
      onQuit: async () => void await args.dispose?.(),
      onKey(e) {
        if (e.key !== 'o') return;
        const url = args.url ?? `http://localhost:${args.port}`;
        sh.run(`open ${url}`);
      },
    });
    if (!handle) return;

    if (args.print) printKeyboard();
    return handle;
  } catch (error) {
    if (Cli.Keyboard.isUnavailableError(error)) return;
    throw error;
  }
}

function printKeyboard() {
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
