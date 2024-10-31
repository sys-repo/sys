import { type t, rx, asArray } from './common.ts';

export const Watch: t.FsWatchLib = {
  start(pathInput, options = {}) {
    const { recursive = true } = options;

    const life = rx.lifecycle(options.dispose$);
    const { dispose, dispose$ } = life;
    const paths = asArray(pathInput);

    /**
     * API
     */
    const api: t.FsWatcher = {
      paths,

      get is() {
        return { recursive };
      },

      /** Lifecycle: disposes of the watches. */
      dispose,

      /** Lifecycle: observable that fires when the watcher disposes. */
      dispose$,

      /** Lifecycle: flag indicating if the watcher has been disposed. */
      get disposed() {
        return life.disposed;
      },
    };
    return api;
  },
};
