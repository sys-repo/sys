import { FilesPath } from '../m.files/u.path.ts';
import { Is, type t } from './common.ts';
import { fail } from './u.error.ts';
import { fileNode, type MemoryNode } from './u.node.ts';
import { absolutePath, visiblePath } from './u.path.ts';

export type MemoryIndex = ReadonlyMap<t.StringAbsolutePath, MemoryNode>;

export const memoryIndex = (options: t.FilesMemory.ReadonlyOptions = {}): MemoryIndex => {
  assertOptions(options);

  const nodes = new Map<t.StringAbsolutePath, MemoryNode>();
  const putDirNode = (input: t.Files.StringPath) => putNode(nodes, input, { kind: 'dir' });
  const putDir = (input: t.Files.StringPath) => {
    const segments = input.split('/').filter(Boolean);
    let current = '' as t.Files.StringPath;
    putDirNode(current);

    for (const segment of segments) {
      current = (current ? `${current}/${segment}` : segment) as t.Files.StringPath;
      putDirNode(current);
    }
  };

  putDir('' as t.Files.StringPath);
  for (const dir of options.dirs ?? []) putDir(visiblePath(dir));
  for (const [name, file] of Object.entries(options.files ?? {})) {
    const path = visiblePath(name);
    if (path === '') throw fail('FilesMemoryError.InvalidPath', 'File path cannot be root');
    putDir(FilesPath.parent(path));
    putNode(nodes, path, fileNode(file));
  }

  return nodes;
};

function assertOptions(options: unknown): asserts options is t.FilesMemory.ReadonlyOptions {
  if (!Is.plainObject(options)) {
    throw fail('FilesMemoryError.InvalidPath', 'Memory options must be a plain object');
  }
  if (options.files !== undefined && !Is.plainObject(options.files)) {
    throw fail('FilesMemoryError.InvalidPath', 'Memory files must be a plain object');
  }
  if (options.dirs !== undefined && !Is.array(options.dirs)) {
    throw fail('FilesMemoryError.InvalidPath', 'Memory dirs must be an array');
  }
}

function putNode(
  nodes: Map<t.StringAbsolutePath, MemoryNode>,
  input: t.Files.StringPath,
  node: MemoryNode,
) {
  const absolute = absolutePath(input);
  const existing = nodes.get(absolute);
  if (existing && existing.kind !== node.kind) {
    throw fail(
      'FilesMemoryError.InvalidPath',
      `${node.kind} conflicts with ${existing.kind}: ${input}`,
    );
  }
  nodes.set(absolute, node);
}
