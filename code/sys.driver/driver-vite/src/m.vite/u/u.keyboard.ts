import { Cli, Open, Rx, type t } from '../common.ts';

type KeypressEvent = t.Cli.Keyboard.Is.RedrawInput;
type KeypressStream = AsyncIterable<KeypressEvent>;
type KeyboardAction = 'noop' | 'open' | 'redraw' | 'quit';
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
  redraw?: () => void;
  dispose: () => Promise<void>;
}, deps: KeyboardDeps = {}) {
  const { dispose } = args;
  const url = new URL(args.url).href as t.StringUrl;
  const keypress = deps.keypress ?? Cli.keypress;
  const open = deps.open ?? ((url) => Open.invokeDetached(args.cwd, url, { silent: true }));
  const exit = deps.exit ?? ((code) => Deno.exit(code));

  return async () => {
    for await (const e of wrangle.keypressEvents(keypress, args.until)) {
      switch (wrangle.action(e)) {
        case 'noop':
          continue;
        case 'open':
          open(url);
          continue;
        case 'redraw':
          await wrangle.redraw(args.redraw, dispose);
          continue;
        case 'quit':
          await dispose();
          exit(0);
          return;
      }
    }
  };
}

const wrangle = {
  async *keypressEvents(
    keypress: () => KeypressStream,
    until?: t.Process.Handle['dispose$'],
  ) {
    try {
      for await (const event of keypress()) yield event;
    } catch (error) {
      if (!wrangle.isUnsupportedKeyboard(error)) throw error;
      await wrangle.waitUntil(until);
    }
  },

  async redraw(redraw: (() => void) | undefined, dispose: () => Promise<void>) {
    try {
      redraw?.();
    } catch (cause) {
      try {
        await dispose();
      } catch {
        // Redraw remains the primary failure.
      }
      throw cause;
    }
  },

  action(e: KeypressEvent): KeyboardAction {
    if (!e.key) return 'noop';
    if ((e.ctrlKey && e.key === 'c') || e.key === 'q') return 'quit';
    if (e.key === 'o') return 'open';
    if (Cli.Keyboard.Is.redraw(e)) return 'redraw';
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
