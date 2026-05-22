import { FilesPath } from '../../m.files/u/u.path.ts';
import { Is, type t } from '../common.ts';
import { fail } from './u.error.ts';
import { fileNode, type MemoryFileNode, type MemoryNode } from './u.node.ts';
import { absolutePath, visiblePath } from './u.path.ts';

export type MemoryNodes = Map<t.StringAbsolutePath, MemoryNode>;

export const memoryIndex = (options: t.FilesMemory.Options = {}): MemoryNodes => {
  assertOptions(options);

  const nodes: MemoryNodes = new Map<t.StringAbsolutePath, MemoryNode>();
  putDir(nodes, '' as t.Files.String.Path);
  for (const dir of options.dirs ?? []) putDir(nodes, dir);
  for (const [name, file] of Object.entries(options.files ?? {})) putFile(nodes, name, file);

  return nodes;
};

export function putDir(nodes: MemoryNodes, input: t.Files.String.Path) {
  const path = visiblePath(input);
  const segments = path.split('/').filter(Boolean);
  let current = '' as t.Files.String.Path;
  putNode(nodes, current, { kind: 'dir' });

  for (const segment of segments) {
    current = (current ? `${current}/${segment}` : segment) as t.Files.String.Path;
    putNode(nodes, current, { kind: 'dir' });
  }
}

export function putFile(
  nodes: MemoryNodes,
  input: t.Files.String.Path,
  file: t.Files.Source.TextFileInput,
): t.Files.String.Path {
  const path = visiblePath(input);
  if (path === '') throw fail('FilesMemoryError.InvalidPath', 'File path cannot be root');
  putDir(nodes, FilesPath.parent(path));
  putNode(nodes, path, fileNode(file));
  return path;
}

export function putWriteFile(
  nodes: MemoryNodes,
  input: t.Files.String.Path,
  node: MemoryFileNode,
): { readonly path: t.Files.String.Path; readonly previous?: MemoryNode } {
  const path = visiblePath(input);
  if (path === '') throw fail('FilesMemoryError.InvalidPath', 'File path cannot be root');

  const previous = nodes.get(absolutePath(path));
  if (previous?.kind === 'dir') throw fail('FilesMemoryError.NotFile', `Not a file: ${path}`);

  putDir(nodes, FilesPath.parent(path));
  putNode(nodes, path, node);
  return { path, ...(previous === undefined ? {} : { previous }) };
}

function assertOptions(options: unknown): asserts options is t.FilesMemory.Options {
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
  input: t.Files.String.Path,
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
