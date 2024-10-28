import { Plugin } from '../m.Vite.Plugin/mod.ts';
import { Cmd, ViteConfig as Config, DEFAULTS, type t } from './common.ts';
import { build } from './u.build.ts';
import { keyboardFactory, Log, Wrangle } from './u.ts';

/**
 * Tools for running Vite via commands issued to a child process.
 */
export const Vite: t.ViteLib = {
  Config,
  Plugin,
  common: Plugin.common,
  build,

  /**
   * Run the <vite:build> command.
   * Long running processes (spawn → child process).
   *
   * Command:
   *    $ vite dev --port=<1234>
   */
  async dev(input: t.ViteDevArgs): Promise<t.ViteProcess> {
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
    return {
      proc,
      port,
      url,
      listen,
      keyboard,
      dispose,
    };
  },
} as const;
