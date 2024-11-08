import { Cmd, Net, type t } from './common.ts';
import { keyboardFactory } from './u.keyboard.ts';

type F = t.VitePressLib['dev'];

export const dev: F = async (input = {}) => {
  const options = wrangle.options(input);
  const { path = 'docs', pkg } = options;
  const port = Net.port(options.port ?? 1234);
  const cmd = `deno run -A --node-modules-dir npm:vitepress dev ${path} --port ${port}`;
  const args = cmd.split(' ').slice(1);
  const url = `http://localhost:${port}`;

  const proc = Cmd.spawn({ args, silent: false, dispose$: options.dispose$ });
  const dispose = proc.dispose;
  const keyboard = keyboardFactory({ port, url, dispose, pkg });

  const listen = async () => {
    await keyboard();
  };

  await proc.whenReady();
  const api: t.VitePressDevServer = {
    proc,
    port,
    path,
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

/**
 * Helpers
 */
const wrangle = {
  options(input: Parameters<F>[0]): t.VitePressDevOptions {
    if (typeof input === 'string') return { path: input };
    return input ?? {};
  },
} as const;
