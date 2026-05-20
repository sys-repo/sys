import { Is, type t } from '../common.ts';
import { type MemoryNodes, putFile, removePath } from '../u.index.ts';
import { absolutePath, visiblePath } from '../u.path.ts';
import { fail } from '../u.error.ts';

/**
 * Transitional owner-side mutation driver used to prove live watch behavior before
 * Files write/remove commands exist.
 *
 * This is not Files authority and must not be exported from the public module.
 * Delete this path when FilesCmd.write/remove become the source of live changes.
 */
export type LiveDriver = {
  readonly writeText: (
    path: t.Files.String.Path,
    content: string,
    file?: Omit<t.FilesSource.TextFile, 'content'>,
  ) => Promise<t.Files.Change>;
  readonly remove: (path: t.Files.String.Path) => Promise<t.Files.Change | undefined>;
};

export type EmitChange = (
  kind: t.Files.Change['kind'],
  path: t.Files.String.Path,
) => t.Files.Change;

/** Create the transitional owner-side mutation driver. */
export const createLiveDriver = (nodes: MemoryNodes, emit: EmitChange): LiveDriver => {
  return Object.freeze({
    async writeText(input, content, file = {}) {
      if (!Is.string(content)) {
        throw fail('FilesMemoryError.InvalidPath', 'Memory file content must be a string');
      }

      const path = visiblePath(input);
      const existing = nodes.get(absolutePath(path));
      const kind = existing?.kind === 'file' ? 'modified' : 'created';
      putFile(nodes, path, { ...file, content });
      return emit(kind, path);
    },

    async remove(input) {
      const removed = removePath(nodes, input);
      if (!removed) return undefined;
      return emit('deleted', removed.path);
    },
  });
};
