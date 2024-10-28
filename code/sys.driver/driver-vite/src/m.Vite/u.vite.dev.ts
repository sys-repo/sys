import { Cmd, DEFAULTS, type t } from './common.ts';
import { keyboardFactory } from './u.keyboard.ts';
import { Log, Wrangle } from './u.ts';

/**
 * Run the <vite:build> command.
 * Long running processes (spawn → child process).
 *
 * Command:
 *    $ vite dev --port=<1234>
 */
export const dev: t.ViteLib['dev'] = async (input) => {
  const { port = DEFAULTS.port, silent = false, pkg } = input;
  const { env, args, paths } = Wrangle.command(input, `dev --port=${port}`);
  const url = `http://localhost:${port}/`;

  if (!silent && pkg) Log.Entry.log(pkg, input.input);

  const proc = Cmd.spawn({ args, env, silent });
  const { dispose } = proc;
  const keyboard = keyboardFactory({ pkg, paths, port, url, dispose });

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
    dispose,
  };
  return api;
};
