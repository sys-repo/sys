import { Cmd, type t } from './common.ts';

export const dev: t.VitePressLib['dev'] = async (options = {}) => {
  const { port = 1234, path = 'docs' } = options;
  const cmd = `deno run -A --node-modules-dir npm:vitepress dev ${path} --port ${port}`;
  const args = cmd.split(' ').slice(1);
  const url = `http://localhost:${port}`;

  const proc = Cmd.spawn({ args, silent: false, dispose$: options.dispose$ });
  const dispose = proc.dispose;

  await proc.whenReady();
  const api: t.VitePressDevResponse = {
    proc,
    port,
    path,
    url,

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
