import { Num, type t } from '../common.ts';
import { fail } from './error.ts';
import { ancestors, pathFromObjectKey } from './path.ts';

export type FileNode = {
  readonly entry: t.Files.File;
  readonly object: t.R2.ObjectInfo;
};

export type EntryIndex = {
  readonly files: ReadonlyMap<t.Files.String.Path, FileNode>;
  readonly dirs: ReadonlySet<t.Files.String.Path>;
};

/** Build a deterministic Files tree projection from flat R2 objects. */
export function buildEntryIndex(prefix: string, objects: readonly t.R2.ObjectInfo[]): EntryIndex {
  const files = new Map<t.Files.String.Path, FileNode>();
  const dirs = new Set<t.Files.String.Path>(['' as t.Files.String.Path]);

  for (const object of objects) {
    const path = pathFromObjectKey(prefix, object.key);
    if (path === undefined || path === '') continue;
    if (dirs.has(path)) throw collision(path);

    for (const ancestor of ancestors(path)) {
      if (files.has(ancestor)) throw collision(ancestor);
      dirs.add(ancestor);
    }
    files.set(path, { entry: fileEntry(path, object), object });
  }

  return Object.freeze({ files, dirs });
}

/** Convert R2 object list metadata to a Files file entry. */
export function fileEntry(path: t.Files.String.Path, object: t.R2.ObjectInfo): t.Files.File {
  return {
    path,
    kind: 'file',
    size: object.size,
    ...modifiedAt(object.modifiedAt),
  };
}

/** Convert R2 object stat metadata to a Files file entry. */
export function fileEntryFromMeta(
  path: t.Files.String.Path,
  object: t.R2.ObjectMeta,
): t.Files.File {
  return {
    path,
    kind: 'file',
    size: object.size,
    ...modifiedAt(object.modifiedAt),
    ...(object.metadata?.mediaType === undefined ? {} : { mediaType: object.metadata.mediaType }),
  };
}

/** Synthetic Files directory entry. */
export function dirEntry(path: t.Files.String.Path): t.Files.Dir {
  return { path, kind: 'dir' };
}

function modifiedAt(input: Date | undefined): Pick<t.Files.Entry.Base, 'modifiedAt'> {
  if (input === undefined) return {};
  const value = input.getTime();
  return Num.Is.safeInt(value) ? { modifiedAt: value } : {};
}

function collision(path: t.Files.String.Path): Error {
  return fail('FilesR2Error.InvalidPath', `R2 object tree collision: ${path}`);
}
