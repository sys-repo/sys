import { Is, Num, Pkg, type t } from '../common.ts';
import { invalidPath } from './u.error.ts';
import { parentPath, visiblePath } from './u.path.ts';
import { contentRef } from './u.ref.ts';

export type StaticFile = {
  readonly entry: t.Files.Entry.File;
  readonly contentRef: t.Files.ContentRef;
};

export type StaticIndex = {
  readonly entries: readonly t.Files.Entry[];
  readonly entriesByPath: ReadonlyMap<t.Files.String.Path, t.Files.Entry>;
  readonly filesByPath: ReadonlyMap<t.Files.String.Path, StaticFile>;
  readonly distBuildTime?: t.UnixTimestamp;
};

/** Build the static Files index from content facts, not a descriptive manifest. */
export function staticIndex(options: {
  dist: unknown;
  baseUrl?: t.StringUrl;
  buildTime?: t.UnixTimestamp;
}): StaticIndex {
  const { dist, baseUrl } = options;
  if (!Is.record(dist) || !Pkg.Is.distPin({ scheme: dist.scheme, digest: dist.digest })) {
    throw invalidPath('Invalid static content inventory');
  }
  try {
    Pkg.Dist.Content.encode(dist.parts as t.DistContent['parts']);
  } catch {
    throw invalidPath('Invalid static content inventory');
  }
  if (baseUrl !== undefined && !Is.string(baseUrl)) {
    throw invalidPath('Invalid static Files base URL');
  }

  const dirs = new Set<t.Files.String.Path>(['' as t.Files.String.Path]);
  const files = new Map<t.Files.String.Path, StaticFile>();

  for (const [rawPath, rawPart] of Object.entries(dist.parts as t.DistContent['parts'])) {
    const path = visiblePath(rawPath as t.Files.String.Path);
    if (path === '' || path !== rawPath) throw invalidPath('Noncanonical static file path');
    if (dirs.has(path)) throw invalidPath(`file conflicts with dir: ${path}`);

    const info = Pkg.Dist.Part.parse(rawPart);
    if (!info) throw invalidPath(`Invalid static dist part: ${path}`);

    putParentDirs(dirs, files, path);
    const file = fileEntry(path, info);
    files.set(path, Object.freeze({ entry: file, contentRef: contentRef({ file, baseUrl }) }));
  }

  const entries = [...dirEntries(dirs), ...[...files.values()].map((item) => item.entry)]
    .sort((a, b) => a.path.localeCompare(b.path));
  const entriesByPath = new Map<t.Files.String.Path, t.Files.Entry>();
  for (const entry of entries) entriesByPath.set(entry.path, entry);

  const distBuildTime = Num.Is.finite(options.buildTime) ? options.buildTime : undefined;

  return Object.freeze({
    entries: Object.freeze(entries),
    entriesByPath,
    filesByPath: files,
    ...(distBuildTime === undefined ? {} : { distBuildTime }),
  });
}

/**
 * Helpers:
 */
function putParentDirs(
  dirs: Set<t.Files.String.Path>,
  files: ReadonlyMap<t.Files.String.Path, StaticFile>,
  path: t.Files.String.Path,
) {
  const parts = parentPath(path).split('/').filter(Boolean);
  let current = '' as t.Files.String.Path;
  for (const part of parts) {
    current = (current ? `${current}/${part}` : part) as t.Files.String.Path;
    if (files.has(current)) throw invalidPath(`dir conflicts with file: ${current}`);
    dirs.add(current);
  }
}

function dirEntries(dirs: ReadonlySet<t.Files.String.Path>): readonly t.Files.Entry.Dir[] {
  return [...dirs]
    .filter((path) => path !== '')
    .map((path) => Object.freeze({ path, kind: 'dir' as const }));
}

type PartInfo = { readonly hash: t.StringHash; readonly size?: t.NumberBytes };

function fileEntry(path: t.Files.String.Path, info: PartInfo): t.Files.Entry.File {
  return Object.freeze({
    path,
    kind: 'file',
    ...(info.size === undefined ? {} : { size: info.size }),
    hash: info.hash,
  });
}
