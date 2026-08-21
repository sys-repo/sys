import { c, Cli, Process, Str } from '../common.ts';

export type KeyboardDependencies = {
  readonly bind: typeof Cli.Keyboard.bind;
  readonly isUnavailableError: typeof Cli.Keyboard.Is.unavailableError;
  readonly sh: typeof Process.sh;
  readonly exit: typeof Deno.exit;
};

const DEFAULT_DEPS: KeyboardDependencies = {
  bind: Cli.Keyboard.bind,
  isUnavailableError: Cli.Keyboard.Is.unavailableError,
  sh: Process.sh,
  exit: Deno.exit,
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

/** Bind keyboard controls and return caller-owned lifecycle authority when active. */
export function bindKeyboard(args: Args) {
  return bindKeyboardWith(DEFAULT_DEPS, args);
}

/** Package-internal keyboard and shell dependency seam. */
export function bindKeyboardWith(deps: KeyboardDependencies, args: Args) {
  return bind(deps, args);
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
    const shouldExit = args.exit ?? true;
    const handle = deps.bind({
      // Server close waits for `finished`; own exit here so `onQuit` can return first.
      exit: false,
      until: args.until,
      onQuit() {
        const closing = args.dispose?.();
        if (!closing) {
          if (shouldExit) deps.exit(0);
          return;
        }

        const completion = shouldExit
          ? closing.then(
            () => deps.exit(0),
            () => undefined,
          )
          : closing;
        void completion.catch(() => undefined);
      },
      onKey(e) {
        if (e.key !== 'o') return;
        const url = args.url ?? `http://localhost:${args.port}`;
        sh.run(`open ${url}`);
      },
    });
    if (!handle) return;

    try {
      if (args.print) printKeyboard();
    } catch (cause) {
      const closing = Cli.Keyboard.shutdown(handle);
      void closing.catch(() => undefined);
      throw cause;
    }
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
