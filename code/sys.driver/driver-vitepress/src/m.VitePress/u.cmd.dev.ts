import { type t, Cmd, Env, Net } from './common.ts';
import { keyboardFactory } from './u.keyboard.ts';
import { Log } from './u.log.ts';

type F = t.VitePressLib['dev'];
type R = t.VitePressDevServer;

/**
 * https://vitepress.dev/reference/cli#vitepress-dev
 */
export const dev: F = async (input = {}) => {
  const options = wrangle.options(input);
  const { pkg, inDir = '', open = true } = options;
  const dirs: R['dirs'] = { in: inDir };
  const port = Net.port(options.port ?? 1234);

  let params = `--port=${port}`;
  if (open) params += ` --open`;
  const cmd = `deno run -A --node-modules-dir npm:vitepress dev ${inDir} ${params}`;
  const args = cmd.split(' ').slice(1);
  const url = `http://localhost:${port}`;

  Log.Dev.log({ inDir, pkg });

  const proc = Cmd.spawn({ args, silent: false, dispose$: options.dispose$ });
  const dispose = proc.dispose;
  const keyboard = keyboardFactory({ port, url, pkg, dispose });

  const listen = async () => {
    await keyboard();
  };

  await proc.whenReady();
  const api: R = {
    port,
    url,
    listen,
    keyboard,

    get proc() {
      return proc;
    },

    get dirs() {
      return dirs;
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

/**
 * Helpers
 */
const wrangle = {
  options(input: Parameters<F>[0]): t.VitePressDevArgs {
    if (typeof input === 'string') return { inDir: input };
    return input ?? {};
  },
} as const;
