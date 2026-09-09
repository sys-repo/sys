import { Num, type t } from '../common.ts';
import { snapshotOptionalMatch } from './u.match.ts';

export type FilesInvalid = (message: string) => Error;

export type ListEntriesOptions = {
  readonly path: t.Files.String.Path;
  readonly depth?: t.Files.Depth;
  readonly match?: t.Files.Match;
  readonly exclude?: t.Files.Match;
};

export type RelativePath = (
  base: t.Files.String.Path,
  path: t.Files.String.Path,
) => t.StringRelativePath;

/** Snapshot and validate shared Files list-entry options. */
export const snapshotListOptions = (
  options: ListEntriesOptions,
  invalid: FilesInvalid,
): ListEntriesOptions => {
  if (options.depth !== undefined && (!Num.Is.safeInt(options.depth) || options.depth < 0)) {
    throw invalid('Invalid Files depth');
  }
  return Object.freeze({
    path: options.path,
    ...(options.depth === undefined ? {} : { depth: options.depth }),
    ...(options.match === undefined
      ? {}
      : { match: snapshotOptionalMatch(options.match, invalid, 'Invalid Files match') }),
    ...(options.exclude === undefined
      ? {}
      : { exclude: snapshotOptionalMatch(options.exclude, invalid, 'Invalid Files exclude') }),
  });
};

/** True when `path` is inside the bounded list scope `base`. */
export const withinScope = (
  path: t.Files.String.Path,
  base: t.Files.String.Path,
  relative: RelativePath,
): boolean => {
  if (base === '') return true;
  return insideRelative(relativePath(path, base, relative));
};

/** True when `path` is within the requested traversal depth under `base`. */
export const withinDepth = (
  path: t.Files.String.Path,
  base: t.Files.String.Path,
  depth: t.Files.Depth | undefined,
  relative: RelativePath,
): boolean => {
  if (depth === undefined) return true;
  const current = base === '' ? path : relativePath(path, base, relative);
  if (current === '') return true;
  return current.split('/').filter(Boolean).length <= depth;
};

/**
 * Helpers:
 */
function relativePath(
  path: t.Files.String.Path,
  base: t.Files.String.Path,
  relative: RelativePath,
): t.StringRelativePath {
  return relative(base, path).replaceAll('\\', '/') as t.StringRelativePath;
}

function insideRelative(relative: t.StringRelativePath): boolean {
  return relative === '' || (!relative.startsWith('../') && relative !== '..');
}
