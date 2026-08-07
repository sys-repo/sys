import { Cli, Open, Rx, type t } from '../common.ts';

type KeypressEvent = {
  readonly key?: string;
  readonly ctrlKey?: boolean;
};
type KeypressStream = AsyncIterable<KeypressEvent>;
type KeyboardAction = 'noop' | 'open' | 'quit';
type KeyboardDeps = {
  keypress?: () => KeypressStream;
  open?: (url: t.StringUrl) => void;
  exit?: (code: number) => void;
};

/**
 * Create a keyboard listener to control the running dev server.
 */
export function keyboardFactory(args: {
  cwd: t.StringDir;
  url: string;
  until?: t.Process.Handle['dispose$'];
  dispose: () => Promise<void>;
}, deps: KeyboardDeps = {}) {
  const { dispose } = args;
  const url = new URL(args.url).href as t.StringUrl;
  const keypress = deps.keypress ?? Cli.keypress;
  const open = deps.open ?? ((url) => Open.invokeDetached(args.cwd, url, { silent: true }));
  const exit = deps.exit ?? ((code) => Deno.exit(code));

  return async () => {
    try {
      for await (const e of keypress()) {
        const action = wrangle.action(e);
        if (action === 'noop') continue;
        if (action === 'open') {
          open(url);
          continue;
        }
        if (action === 'quit') {
          await dispose();
          exit(0);
          return;
        }
      }
    } catch (error) {
      if (wrangle.isUnsupportedKeyboard(error)) {
        await wrangle.waitUntil(args.until);
        return;
      }
      throw error;
    }
  };
}

const wrangle = {
  action(e: KeypressEvent): KeyboardAction {
    if (!e.key) return 'noop';
    if ((e.ctrlKey && e.key === 'c') || e.key === 'q') return 'quit';
    if (e.key === 'o') return 'open';
    return 'noop';
  },

  isUnsupportedKeyboard(error: unknown) {
    if (error instanceof Deno.errors.BadResource) return true;
    return error instanceof Error && /ENOTTY|Not a typewriter/i.test(error.message);
  },

  async waitUntil(until?: t.Process.Handle['dispose$']) {
    if (!until) return;
    await Rx.firstValueFrom(until.pipe(Rx.defaultIfEmpty(undefined)));
  },
} as const;
