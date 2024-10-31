import { type t, rx, asArray, exists, Err } from './common.ts';

export const Watch: t.FsWatchLib = {
  async start(pathInput, options = {}) {
    const { recursive = true } = options;
    const paths = asArray(pathInput);
    const errors = Err.errors();
    const life = rx.lifecycle(options.dispose$);
    const { dispose, dispose$ } = life;

    // Ensure the watch paths exist.
    const exists = await wrangle.exists(paths);
    if (!exists.ok) {
      exists.paths
        .filter((e) => !e.exists)
        .forEach((e) => errors.push(`Watch path does not exist: ${e.path}`));
    }

    /**
     * API
     */
    const api: t.FsWatcher = {
      paths,

      get exists() {
        return exists.ok;
      },

      get is() {
        return { recursive };
      },

      get error() {
        return errors.toError('Several errors occured while watching file-system paths.');
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

/**
 * Helpers
 */
const wrangle = {
  async exists(watching: t.StringPath[]) {
    const wait = watching.map(async (path) => ({ path, exists: await exists(path) }));
    const paths = await Promise.all(wait);
    const ok = paths.every((item) => item.exists);
    return { ok, paths } as const;
  },
} as const;
