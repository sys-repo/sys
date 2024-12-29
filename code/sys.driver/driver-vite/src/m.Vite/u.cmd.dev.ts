import { type t, stripAnsi, Cmd, DEFAULTS, Net, Path, Pkg } from './common.ts';
import { keyboardFactory } from './u.keyboard.ts';
import { Log, Wrangle } from './u.ts';

type D = t.ViteLib['dev'];

/**
 * Matches (example):
 *   VITE v6.0.3  ready in 955 ms
 */
const viteStartupRegex = /VITE v\d\.\d\.\d\s+ready in \d+ ms/g;

/**
 * Run the <vite:build> command.
 * Long running processes (spawn → child process).
 *
 * Command:
 *    $ vite dev --port=<1234> --host
 */
export const dev: D = async (input) => {
  const { silent = false, pkg } = input;
  const port = Net.port(input.port ?? DEFAULTS.port);
  const { dist } = await Pkg.Dist.load(Path.resolve('./dist/dist.json'));

  const url = `http://localhost:${port}/`;
  const { env, args, paths } = Wrangle.command(input, `dev --port=${port} --host`);

  if (!silent && pkg) Log.Entry.log(pkg, input.input);

  const readySignal: t.CmdReadySignalFilter = (e) => {
    const text = stripAnsi(e.toString());
    const match = viteStartupRegex.exec(text);
    return !!match;
  };

  const proc = Cmd.spawn({ args, env, silent, readySignal, dispose$: input.dispose$ });
  const { dispose } = proc;
  const keyboard = keyboardFactory({ pkg, dist, paths, port, url, dispose });
  const listen = async () => {
    await keyboard();
  };

  await proc.whenReady();
  const api: t.ViteProcess = {
    port,
    url,
    listen,
    keyboard,

    get proc() {
      return proc;
    },

    /**
     * Lifecycle.
     */
    dispose,
    get dispose$() {
      return proc.dispose$;
    },
    get disposed() {
      return proc.disposed;
    },
  };
  return api;
};
