import { type t } from '../common.ts';

type WatchOptions = t.FsCapability.Files.WatchOptions & {
  readonly includePath?: (path: t.StringPath) => boolean;
};

/** Adapt an `@sys/fs` watcher to the structural Files watcher shape. */
export async function watch(
  fs: t.Fs.Lib,
  path: t.StringPath,
  options: WatchOptions = {},
): Promise<t.FsCapability.Files.Watcher> {
  const watcher = await fs.watch(path, { recursive: options.recursive });
  const $: t.FsCapability.Files.WatchObservable = Object.freeze({
    subscribe(next) {
      const subscription = watcher.$.subscribe((event) => {
        const projected = toWatchEvent(event, options.includePath);
        if (projected.paths.length > 0) next(projected);
      });
      return Object.freeze({ unsubscribe: () => subscription.unsubscribe() });
    },
  });

  return Object.freeze({
    $,
    get paths() {
      return [...watcher.paths];
    },
    get exists() {
      return watcher.exists;
    },
    get error() {
      return watcher.error;
    },
    dispose() {
      watcher.dispose();
    },
  });
}

function toWatchEvent(
  event: t.Watch.Event,
  includePath: WatchOptions['includePath'],
): t.FsCapability.Files.WatchEvent {
  const paths = includePath ? event.paths.filter(includePath) : [...event.paths];
  return {
    kind: watchKind(event.kind),
    paths,
  };
}

function watchKind(kind: t.Watch.Event['kind']): t.FsCapability.Files.WatchEventKind {
  switch (kind) {
    case 'any':
    case 'access':
    case 'create':
    case 'modify':
    case 'remove':
    case 'other':
      return kind;
    default:
      return 'other';
  }
}
