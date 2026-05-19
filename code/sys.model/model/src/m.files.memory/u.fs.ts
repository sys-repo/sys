import { type t } from './common.ts';
import { memoryIndex } from './u.index.ts';
import { statFromNode } from './u.node.ts';
import { path, ROOT } from './u.path.ts';

/** Create a structural readonly filesystem capability from in-memory nodes. */
export const memoryFs = (options: t.FilesMemory.ReadonlyOptions = {}) => {
  const nodes = memoryIndex(options);

  const fs: t.FilesFs.Capability.Readonly = {
    path,

    realPath(input) {
      const absolute = path.resolve(input);
      return nodes.has(absolute) ? absolute : undefined;
    },

    stat(input) {
      const node = nodes.get(path.resolve(input));
      return node ? statFromNode(node) : undefined;
    },

    readText(input) {
      const node = nodes.get(path.resolve(input));
      return node?.kind === 'file' ? node.content : undefined;
    },

    walk(input) {
      const dir = path.resolve(input);
      const prefix = dir === '/' ? '/' : `${dir}/`;
      return Array.from(nodes.entries())
        .filter(([entryPath]) => entryPath !== dir && entryPath.startsWith(prefix))
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([entryPath, node]) => ({
          path: entryPath,
          kind: node.kind,
          isFile: node.kind === 'file',
          isDirectory: node.kind === 'dir',
          stat: statFromNode(node),
        }));
    },
  };

  return { fs, root: ROOT };
};
