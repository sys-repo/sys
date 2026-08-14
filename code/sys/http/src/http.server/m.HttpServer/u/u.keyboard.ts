import { c, Cli, Process, Str } from '../common.ts';

export type KeyboardDependencies = {
  readonly bind: typeof Cli.Keyboard.bind;
  readonly isUnavailableError: typeof Cli.Keyboard.isUnavailableError;
  readonly sh: typeof Process.sh;
};

const DEFAULT_DEPS: KeyboardDependencies = {
  bind: Cli.Keyboard.bind,
  isUnavailableError: Cli.Keyboard.isUnavailableError,
  sh: Process.sh,
};

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
  const handle = bind(DEFAULT_DEPS, args);
  if (!handle) return;
  await handle.finished;
}

/**
 * Bind keyboard controls and report whether terminal binding is active.
 */
export function bindKeyboard(args: Args): boolean {
  return bindKeyboardWith(DEFAULT_DEPS, args);
}

/** Package-internal keyboard and shell dependency seam. */
export function bindKeyboardWith(deps: KeyboardDependencies, args: Args): boolean {
  const handle = bind(deps, args);
  if (!handle) return false;

  void handle.finished.catch((error: unknown) => {
    if (!deps.isUnavailableError(error)) console.warn(error);
  });
  return true;
}

/**
 * Helpers:
 */
function bind(
  deps: KeyboardDependencies,
  args: Args,
): ReturnType<typeof Cli.Keyboard.bind> {
  try {
    const sh = deps.sh();
    const handle = deps.bind({
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
    if (deps.isUnavailableError(error)) return;
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
