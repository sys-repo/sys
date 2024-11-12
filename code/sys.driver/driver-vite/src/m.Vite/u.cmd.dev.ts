import { Cmd, DEFAULTS, Net, Path, Pkg, type t } from './common.ts';
import { keyboardFactory } from './u.keyboard.ts';
import { Log, Wrangle } from './u.ts';

type D = t.ViteLib['dev'];

/**
 * Run the <vite:build> command.
 * Long running processes (spawn → child process).
 *
 * Command:
 *    $ vite dev --port=<1234> --host
 *
 */
export const dev: D = async (input) => {
  const { silent = false, pkg } = input;
  const port = Net.port(input.port ?? DEFAULTS.port);
  const { dist } = await Pkg.Dist.load(Path.resolve('./dist/dist.json'));
  const url = `http://localhost:${port}/`;

  const { env, args, paths } = Wrangle.command(input, `dev --port=${port} --host`);

  if (!silent && pkg) Log.Entry.log(pkg, input.input);

  const proc = Cmd.spawn({ args, env, silent, dispose$: input.dispose$ });
  const { dispose } = proc;
  const keyboard = keyboardFactory({ pkg, dist, paths, port, url, dispose });
  const listen = async () => {
    await keyboard();
  };

  await proc.whenReady();
  const api: t.ViteProcess = {
    proc,
    port,
    url,
    listen,
    keyboard,

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
