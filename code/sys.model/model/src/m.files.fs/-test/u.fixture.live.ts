import { type t } from '../../-test.ts';
import { FilesPath } from '../../m.files/u/u.path.ts';
import { Files } from '../mod.ts';
import type * as TCapability from '../t/t.capability.ts';
import { allowAllPolicy, allowDocsPolicy } from './u.fixture.ts';

export type LiveFsFixture = {
  readonly fs: t.FilesFs.Capability.Live;
  readonly root: t.StringAbsolutePath;
  readonly writeText: (path: t.Files.String.Path, content: string) => Promise<void>;
  readonly remove: (path: t.Files.String.Path) => Promise<void>;
  readonly dispose: () => Promise<void>;
};

export type SetupLiveOptions = {
  readonly policy?: t.Files.Policy.Shape;
  readonly maxReadBytes?: t.NumberBytes;
  readonly defaultLimit?: t.Files.Limit;
};

export type LiveSetup = LiveFsFixture & {
  readonly backing: t.FilesFs.Live;
};

export const allowDocsLivePolicy = {
  ...allowDocsPolicy,
  watch: 'docs/**',
} satisfies t.Files.Policy.Shape;

export const allowAllLivePolicy = {
  ...allowAllPolicy,
  watch: '**',
} satisfies t.Files.Policy.Shape;

const Path = FilesPath.posix() satisfies TCapability.Path;

export async function liveFsFixture(): Promise<LiveFsFixture> {
  const root = await Deno.makeTempDir({ prefix: 'sys-model-files-live-' }) as t.StringAbsolutePath;
  const watchers = new Set<t.DisposableLike>();
  let disposed = false;

  const fs: t.FilesFs.Capability.Live = {
    Path,
    realPath,
    stat,
    readText,
    walk,
    watch,
  };

  const fixture: LiveFsFixture = {
    fs,
    root,
    writeText(path, content) {
      return writeText(root, path, content);
    },
    remove(path) {
      return removePath(absolute(root, path));
    },
    async dispose() {
      if (disposed) return;
      disposed = true;
      for (const watcher of [...watchers]) watcher.dispose();
      watchers.clear();
      await removePath(root);
    },
  };

  await seed(root);
  return fixture;

  function watch(input: t.StringPath, options: TCapability.WatchOptions = {}) {
    const path = Path.resolve(input);
    return startWatcher(path, options, watchers);
  }
}

export async function setupLive(options: SetupLiveOptions = {}): Promise<LiveSetup> {
  const fixture = await liveFsFixture();
  const backing = Files.Fs.Readonly.live({
    fs: fixture.fs,
    root: fixture.root,
    ...(options.policy === undefined ? {} : { policy: options.policy }),
    ...(options.maxReadBytes === undefined ? {} : { maxReadBytes: options.maxReadBytes }),
    ...(options.defaultLimit === undefined ? {} : { defaultLimit: options.defaultLimit }),
  });
  return { ...fixture, backing };
}

async function seed(root: t.StringAbsolutePath): Promise<void> {
  await Promise.all([
    writeText(root, 'docs/nested/guide.md' as t.Files.String.Path, '# Guide'),
    writeText(root, 'docs/private/secret.md' as t.Files.String.Path, 'secret'),
    writeText(root, 'docs/readme.md' as t.Files.String.Path, '# Readme'),
    writeText(root, 'public/info.txt' as t.Files.String.Path, 'public info'),
    writeText(root, 'big.txt' as t.Files.String.Path, '0123456789'),
    writeText(root, 'empty.txt' as t.Files.String.Path, ''),
  ]);
}

async function realPath(input: t.StringPath): Promise<t.StringAbsolutePath | undefined> {
  try {
    return await Deno.realPath(input) as t.StringAbsolutePath;
  } catch {
    return undefined;
  }
}

async function stat(input: t.StringPath): Promise<TCapability.Stat | undefined> {
  try {
    return statFromInfo(await Deno.stat(input));
  } catch {
    return undefined;
  }
}

async function readText(input: t.StringPath): Promise<string | undefined> {
  try {
    return await Deno.readTextFile(input);
  } catch {
    return undefined;
  }
}

async function walk(input: t.StringPath): Promise<readonly TCapability.WalkEntry[]> {
  const root = Path.resolve(input);
  const entries: TCapability.WalkEntry[] = [];
  await collect(root, entries);
  return entries.sort((a, b) => a.path.localeCompare(b.path));
}

async function collect(
  dir: t.StringAbsolutePath,
  entries: TCapability.WalkEntry[],
): Promise<void> {
  let listing: Deno.DirEntry[];
  try {
    listing = [];
    for await (const entry of Deno.readDir(dir)) listing.push(entry);
  } catch {
    return;
  }

  for (const entry of listing.sort((a, b) => a.name.localeCompare(b.name))) {
    const path = Path.join(dir, entry.name);
    const info = await stat(path);
    if (!info) continue;
    entries.push({
      path,
      kind: info.kind,
      isFile: info.isFile,
      isDirectory: info.isDirectory,
      stat: info,
    });
    if (info.isDirectory) await collect(path, entries);
  }
}

async function startWatcher(
  path: t.StringAbsolutePath,
  options: TCapability.WatchOptions,
  active: Set<t.DisposableLike>,
): Promise<TCapability.Watcher> {
  const exists = await isDirectory(path);
  if (!exists) return inertWatcher(path, false);

  const native = Deno.watchFs(path, { recursive: options.recursive ?? true });
  const subscribers = new Set<(event: TCapability.WatchEvent) => void>();
  let disposed = false;

  const watcher: t.DisposableLike = {
    dispose() {
      if (disposed) return;
      disposed = true;
      active.delete(watcher);
      native.close();
    },
  };
  active.add(watcher);

  void pump(native, subscribers, () => disposed);

  return {
    paths: [path],
    exists: true,
    dispose: watcher.dispose,
    $: {
      subscribe(next) {
        subscribers.add(next);
        return { unsubscribe: () => subscribers.delete(next) };
      },
    },
  };
}

async function pump(
  native: Deno.FsWatcher,
  subscribers: Set<(event: TCapability.WatchEvent) => void>,
  disposed: () => boolean,
): Promise<void> {
  try {
    for await (const event of native) {
      if (disposed()) return;
      const next: TCapability.WatchEvent = {
        kind: watchKind(event.kind),
        paths: event.paths,
      };
      for (const subscriber of [...subscribers]) subscriber(next);
    }
  } catch {
    return;
  }
}

function watchKind(kind: Deno.FsEvent['kind']): TCapability.WatchEventKind {
  return kind === 'rename' ? 'other' : kind;
}

function inertWatcher(
  path: t.StringAbsolutePath,
  exists: boolean,
): TCapability.Watcher {
  return {
    paths: [path],
    exists,
    dispose() {},
    $: { subscribe: () => ({ unsubscribe() {} }) },
  };
}

async function writeText(
  root: t.StringAbsolutePath,
  path: t.Files.String.Path,
  content: string,
): Promise<void> {
  const parent = FilesPath.parent(path);
  if (parent) await Deno.mkdir(absolute(root, parent), { recursive: true });
  await Deno.writeTextFile(absolute(root, path), content);
}

async function removePath(path: t.StringPath): Promise<void> {
  try {
    await Deno.remove(path, { recursive: true });
  } catch {
    return;
  }
}

async function isDirectory(path: t.StringPath): Promise<boolean> {
  const info = await stat(path);
  return info?.isDirectory === true;
}

function absolute(root: t.StringAbsolutePath, path: t.Files.String.Path): t.StringAbsolutePath {
  return Path.resolve(root, path);
}

function statFromInfo(info: Deno.FileInfo): TCapability.Stat {
  const kind = info.isFile ? 'file' : info.isDirectory ? 'dir' : undefined;
  return {
    kind,
    isFile: info.isFile,
    isDirectory: info.isDirectory,
    isSymlink: info.isSymlink,
    ...(info.isFile ? { size: info.size as t.NumberBytes } : {}),
  };
}
