import { Glob, Is, Num, Str, type t } from '../common.ts';
import { buildEntryIndex, dirEntry, type EntryIndex } from './entry.ts';
import { fail, invalidPath } from './error.ts';
import {
  descendantPrefix,
  encodeKeyPath,
  namespacePrefix,
  objectKey,
  withinDepth,
  withinScope,
} from './path.ts';

export type Runtime = {
  readonly bucket: t.R2.Bucket;
  readonly prefix: string;
  readonly authority: t.Files.Authority.Instance;
  readonly policy: t.Files.Policy.Shape;
  readonly capabilities: t.Files.Capabilities;
  readonly defaultLimit: t.Files.Limit;
};

export type ListQuery = {
  readonly path: t.Files.String.Path;
  readonly depth?: t.Files.Depth;
  readonly match?: t.Files.Match;
  readonly exclude?: t.Files.Match;
};

/** Read the current provider object projection into a Files tree index. */
export async function readIndex(runtime: Runtime): Promise<EntryIndex> {
  const objects: t.R2.ObjectInfo[] = [];
  for await (const object of runtime.bucket.list({ prefix: namespacePrefix(runtime.prefix) })) {
    objects.push(object);
  }
  return buildEntryIndex(runtime.prefix, objects);
}

/** List object infos below a Files directory path. */
export async function descendantObjects(
  runtime: Runtime,
  path: t.Files.String.Path,
  limit?: number,
): Promise<readonly t.R2.ObjectInfo[]> {
  const listPrefix = descendantPrefix(runtime.prefix, path);
  if (!listPrefix.possible) return [];
  const objects: t.R2.ObjectInfo[] = [];
  for await (
    const object of runtime.bucket.list({
      prefix: listPrefix.prefix,
      ...(limit === undefined ? {} : { limit }),
    })
  ) {
    objects.push(object);
  }
  return objects;
}

/** True when at least one descendant object exists. */
export async function hasDescendants(
  runtime: Runtime,
  path: t.Files.String.Path,
): Promise<boolean> {
  return (await descendantObjects(runtime, path, 1)).length > 0;
}

/** Resolve visible entries inside a scope from a prebuilt index. */
export function listEntries(
  runtime: Runtime,
  index: EntryIndex,
  query: ListQuery,
): readonly t.Files.Entry[] {
  validateListQuery(query);
  assertDirectory(index, query.path);

  const entries: t.Files.Entry[] = [];
  for (const dir of index.dirs) {
    if (dir === query.path) continue;
    if (!includeEntry(runtime, query, dir)) continue;
    entries.push(dirEntry(dir));
  }
  for (const { entry } of index.files.values()) {
    if (!includeEntry(runtime, query, entry.path)) continue;
    entries.push(entry);
  }
  const compare = Str.Compare.codeUnit();
  return entries.sort((a, b) => compare(a.path, b.path));
}

/** Create a URL content ref for a Files path/key. */
export function urlRef(
  runtime: Runtime,
  path: t.Files.String.Path,
  entry: t.Files.File,
): t.Files.ContentRef.Url | undefined {
  const origin = runtime.bucket.readOrigin;
  if (!origin) return undefined;
  const key = objectKey(runtime.prefix, path);
  const url = new URL(encodeKeyPath(key), `${origin}/`).toString();
  const size = Num.Is.safeInt(entry.size) && entry.size >= 0 ? entry.size : undefined;
  return {
    kind: 'url',
    path,
    url,
    ...(size === undefined ? {} : { size }),
    ...(entry.mediaType === undefined ? {} : { mediaType: entry.mediaType }),
  };
}

/** Validate the caller supplied list/manifest query shape. */
export function validateListQuery(query: ListQuery): void {
  if (query.depth !== undefined && (!Num.Is.safeInt(query.depth) || query.depth < 0)) {
    throw invalidPath('Invalid Files depth');
  }
  validateMatch(query.match, 'match');
  validateMatch(query.exclude, 'exclude');
}

function assertDirectory(index: EntryIndex, path: t.Files.String.Path): void {
  if (path === '') return;
  if (index.files.has(path)) throw fail('FilesR2Error.NotDirectory', `Not a directory: ${path}`);
  if (!index.dirs.has(path)) throw fail('FilesR2Error.NotFound', `Directory not found: ${path}`);
}

function includeEntry(runtime: Runtime, query: ListQuery, path: t.Files.String.Path): boolean {
  if (!withinScope(path, query.path)) return false;
  if (!withinDepth(path, query.path, query.depth)) return false;
  if (!runtime.authority.allows('list', path)) return false;
  if (query.match && !Glob.matches(query.match, path)) return false;
  if (query.exclude && Glob.matches(query.exclude, path)) return false;
  return true;
}

function validateMatch(input: t.Files.Match | undefined, label: string): void {
  if (input === undefined) return;
  if (Is.string(input)) return;
  if (Is.array<string>(input) && input.every((item) => Is.string(item))) return;
  throw invalidPath(`Invalid Files ${label}`);
}
