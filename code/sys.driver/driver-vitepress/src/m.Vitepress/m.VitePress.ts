import { type t, rx, Cmd } from './common.ts';

type DevOptions = { dispose$?: t.UntilObservable };

export const VitePress = {
  async dev(options: DevOptions = {}) {
    const cmd = 'deno run -A --node-modules-dir npm:vitepress dev .tmp/docs --port 1234';
    const args = cmd.split(' ').slice(1);

    const proc = Cmd.spawn({ args, silent: false, dispose$: options.dispose$ });
    const dispose = proc.dispose;

    await proc.whenReady();
    const api = {
      proc,

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
  },
};
