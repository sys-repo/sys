import { type t, asArray, Err, exists, rx } from './common.ts';

export const Watch: t.FsWatchLib = {
  async start(pathInput, options = {}) {
    const { recursive = true } = options;
    const paths = asArray(pathInput);
    const errors = Err.errors();
    const life = rx.lifecycle(options.dispose$);
    const { dispose, dispose$ } = life;

    const $$ = rx.subject<t.FsWatchEvent>();
    const $ = $$.pipe(rx.takeUntil(dispose$));

    let _watcher: Deno.FsWatcher | undefined;
    dispose$.subscribe(() => _watcher?.close());

    const exists = await wrangle.exists(paths);
    if (!exists.ok) {
      exists.paths
        .filter((e) => !e.exists)
        .forEach((e) => errors.push(`Path to watch does not exist: ${e.path}`));
    }

    const listen = async (watcher: Deno.FsWatcher) => {
      try {
        for await (const event of watcher) {
          $$.next({ ...event });
        }
      } catch (error) {
        errors.push(Err.std(`Error while watching file-system`, { cause: error }));
      }
    };

    if (exists.ok) {
      _watcher = Deno.watchFs(paths, { recursive });
      listen(_watcher);
    }

    /**
     * API
     */
    const api: t.FsWatcher = {
      get $() {
        return $;
      },
      get paths() {
        return paths;
      },
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
      get dispose$() {
        return dispose$;
      },

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
