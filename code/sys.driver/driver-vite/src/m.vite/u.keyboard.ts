import { type t, Cli, Process, ViteConfig } from './common.ts';
import { Log } from './u.log.ts';

type KeypressEvent = {
  readonly key?: string;
  readonly ctrlKey?: boolean;
  readonly shiftKey?: boolean;
};
type KeypressStream = AsyncIterable<KeypressEvent>;
type KeyboardAction = 'noop' | 'open' | 'quit' | 'clear' | 'info' | 'info.extended';
type KeyboardDeps = {
  keypress?: () => KeypressStream;
  workspace?: () => Promise<t.ViteDenoWorkspace>;
  open?: (url: string) => void;
  clear?: () => void;
  print?: (text: string) => void;
  exit?: (code: number) => void;
};

/**
 * Create a keyboard listener to control the running dev server.
 */
export function keyboardFactory(args: {
  paths: t.ViteConfigPaths;
  port: number;
  url: string;
  pkg?: t.Pkg;
  dist?: t.DistPkg;
  dispose: () => Promise<void>;
}, deps: KeyboardDeps = {}) {
  const { pkg, dist, paths, dispose } = args;
  const sh = Process.sh();
  const url = new URL(args.url).href;
  const keypress = deps.keypress ?? Cli.keypress;
  const open = deps.open ?? ((url) => sh.run(`open ${url}`));
  const clear = deps.clear ?? (() => console.clear());
  const print = deps.print ?? ((text) => console.info(text));
  const exit = deps.exit ?? ((code) => Deno.exit(code));

  return async () => {
    try {
      const ws = await (deps.workspace ?? (() => ViteConfig.workspace()))();

      for await (const e of keypress()) {
        const action = wrangle.action(e, Boolean(pkg));
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

        clear();
        if (action === 'clear' && pkg) {
          print(Log.Info.toString({ pkg, url, pad: true }));
          continue;
        }
        if (action === 'info' && pkg) {
          print(Log.Help.toString({ pkg, dist, paths, url, pad: false }));
          continue;
        }
        if (action === 'info.extended' && pkg) {
          print(Log.Help.toString({ pkg, dist, paths, ws, url, pad: true }));
          continue;
        }
      }
    } catch (error) {
      if (error instanceof Deno.errors.BadResource) return;
      if (error instanceof Error && /ENOTTY|Not a typewriter/i.test(error.message)) return;
      throw error;
    }
  };
}

const wrangle = {
  action(e: KeypressEvent, hasPkg: boolean): KeyboardAction {
    if (!e.key) return 'noop';
    if (e.ctrlKey && e.key === 'c') return 'quit';
    if (e.key === 'o') return 'open';
    if (!hasPkg) return 'noop';
    if (e.key === 'k') return 'clear';
    if (e.key === 'i' && e.shiftKey) return 'info.extended';
    if (e.key === 'i') return 'info';
    return 'noop';
  },
} as const;
