import { type t, Arr, Err, exists, Path, rx } from './common.ts';

/**
 * Tools for watching file-system changes.
 */
export const Watch: t.FsWatchLib = {
  /**
   * Start a file-system watcher instance.
   */
  async start(pathInput, options = {}) {
    const { recursive = true } = options;
    const paths = Arr.asArray(pathInput);
    const errors = Err.errors();
    const life = rx.lifecycle(options.dispose$);

    const $$ = rx.subject<t.FsWatchEvent>();
    const $ = $$.pipe(rx.takeUntil(life.dispose$));

    let _watcher: Deno.FsWatcher | undefined;
    life.dispose$.subscribe(() => _watcher?.close());

    const exists = await wrangle.exists(paths);
    if (!exists.ok) {
      exists.paths
        .filter((e) => !e.exists)
        .forEach((e) => errors.push(`Path to watch does not exist: ${e.path}`));
    }

    const listen = async (watcher: Deno.FsWatcher) => {
      try {
        for await (const e of watcher) {
          if (!wrangle.withinScope(recursive, paths, e.paths)) continue;
          $$.next({ ...e });
        }
      } catch (cause) {
        errors.push(Err.std(`Error while watching file-system`, { cause }));
      }
    };

    if (exists.ok) {
      _watcher = Deno.watchFs(paths, { recursive });
      listen(_watcher);
    }

    /**
     * API
     */
    const api = rx.toLifecycle<t.FsWatcher>(life, {
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
    });
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

  withinScope(recursive: boolean, paths: t.StringPath[], subjects: t.StringPath[]) {
    // NB: the {recursive} flat does not work consistently across all OS's.
    if (recursive) return true;
    for (const path of paths) {
      for (const subject of subjects) {
        if (Path.dirname(subject) !== path) return false;
      }
    }
    return true;
  },
} as const;
