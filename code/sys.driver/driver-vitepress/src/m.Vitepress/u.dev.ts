import { Cmd, Net, type t } from './common.ts';

export const dev: t.VitePressLib['dev'] = async (options = {}) => {
  const { path = 'docs' } = options;
  const port = Net.port(options.port ?? 1234);
  const cmd = `deno run -A --node-modules-dir npm:vitepress dev ${path} --port ${port}`;
  const args = cmd.split(' ').slice(1);
  const url = `http://localhost:${port}`;

  const proc = Cmd.spawn({ args, silent: false, dispose$: options.dispose$ });
  const dispose = proc.dispose;

  const listen = async () => {
    // await keyboard();
  };

  await proc.whenReady();
  const api: t.VitePressDevServer = {
    proc,
    port,
    path,
    url,
    listen,

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
