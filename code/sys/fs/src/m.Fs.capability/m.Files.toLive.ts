import { type t } from './common.ts';
import { toReadonly } from './m.Files.toReadonly.ts';

type SourceWatchEvent = t.FsWatchEvent;
type LiveWatchEvent = t.FsCapability.Files.WatchEvent;
type LiveWatchEventKind = t.FsCapability.Files.WatchEventKind;
type LiveWatchObservable = t.FsCapability.Files.WatchObservable;
type LiveWatcher = t.FsCapability.Files.Watcher;

/**
 * Adapt `@sys/fs` into the live readonly+watch capability expected by `@sys/model/files/fs`.
 */
export const toLive: t.FsCapability.Files.Lib['toLive'] = (fs) => {
  const base = toReadonly(fs);
  return Object.freeze({
    ...base,
    watch: (path, options) => watch(fs, path, options),
  });
};

async function watch(
  fs: t.Fs.Lib,
  path: t.StringPath,
  options: t.FsCapability.Files.WatchOptions = {},
): Promise<LiveWatcher> {
  const watcher = await fs.watch(path, { recursive: options.recursive });
  const $: LiveWatchObservable = Object.freeze({
    subscribe(next) {
      const subscription = watcher.$.subscribe((event) => next(toWatchEvent(event)));
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

function toWatchEvent(event: SourceWatchEvent): LiveWatchEvent {
  return {
    kind: watchKind(event.kind),
    paths: [...event.paths],
  };
}

function watchKind(kind: SourceWatchEvent['kind']): LiveWatchEventKind {
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
