import { StdPath, type t } from '../common.ts';
import { failure, isFailure } from './u.failure.ts';
import { normalizedPath } from './u.input.ts';
import { lstat, requireRegularFile } from './u.observation.ts';

const PATH_SEPARATOR = Deno.build.os === 'windows' ? '\\' : '/';

/** Normalize bounded absolute paths and require a strict descendant selection. */
export function normalizeSelection(options: t.SnapshotInput): {
  readonly root: t.StringAbsoluteDir;
  readonly path: t.StringAbsolutePath;
} {
  let root: string;
  let path: string;
  try {
    root = normalizedPath(StdPath.resolve(options.root), 'invalid-root');
  } catch (cause) {
    if (isFailure(cause)) throw cause;
    throw failure('invalid-root');
  }
  try {
    path = normalizedPath(StdPath.resolve(options.path), 'invalid-path');
  } catch (cause) {
    if (isFailure(cause)) throw cause;
    throw failure('invalid-path');
  }
  const relative = StdPath.relative(root, path);
  if (!relative || StdPath.Is.absolute(relative) || !StdPath.Is.within(root, path)) {
    throw failure('invalid-path');
  }
  return { root: root as t.StringAbsoluteDir, path: path as t.StringAbsolutePath };
}

/** Observe the selected chain, rejecting observed symlinks and wrong entry kinds. */
export async function observeSelection(
  root: t.StringAbsoluteDir,
  path: t.StringAbsolutePath,
  io: t.SnapshotIo,
  context: t.SnapshotContext,
): Promise<t.SnapshotObservation> {
  const rootInfo = await lstat(io, root, context);
  if (rootInfo.symlink || !rootInfo.directory) throw failure('unsafe-filesystem');

  const relative = StdPath.relative(root, path);
  if (!relative || StdPath.Is.absolute(relative)) throw failure('invalid-path');
  const segments = relative.split(PATH_SEPARATOR);
  let current = root as string;
  let final: t.SnapshotObservation | undefined;
  // Position distinguishes ancestor directories from the exact final-file spelling.
  for (let index = 0; index < segments.length; index++) {
    const segment = segments[index];
    if (!segment || segment === '.' || segment === '..') throw failure('invalid-path');
    const isFinal = index === segments.length - 1;
    current = isFinal ? path : StdPath.join(current, segment);
    if (!StdPath.Is.within(root, current)) throw failure('invalid-path');

    const observation = await lstat(io, current, context);
    if (observation.symlink) throw failure('unsafe-filesystem');
    if (!isFinal && !observation.directory) throw failure('unsafe-filesystem');
    if (isFinal) {
      requireRegularFile(observation);
      final = observation;
    }
  }
  return final!;
}
