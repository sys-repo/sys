import { utf8ByteLength } from '../m.files/u.bytes.ts';
import { Is, Num, type t } from './common.ts';
import { fail } from './u.error.ts';

export type MemoryNode = MemoryDirNode | MemoryFileNode;
export type MemoryDirNode = { readonly kind: 'dir' };
export type MemoryFileNode = t.FilesSource.TextFile & {
  readonly kind: 'file';
  readonly size: t.NumberBytes;
};

export function fileNode(input: t.FilesSource.TextFileInput): MemoryFileNode {
  const file = Is.string(input) ? { content: input } : input;
  if (!Is.plainObject(file) || !Is.string(file.content)) {
    throw fail('FilesMemoryError.InvalidPath', 'Memory file content must be a string');
  }

  const modifiedAt = optionalTimestamp(file.modifiedAt, 'modifiedAt');
  const hash = optionalString(file.hash, 'hash');
  const mediaType = optionalString(file.mediaType, 'mediaType');

  return {
    kind: 'file',
    content: file.content,
    size: utf8ByteLength(file.content),
    ...(modifiedAt === undefined ? {} : { modifiedAt }),
    ...(hash === undefined ? {} : { hash }),
    ...(mediaType === undefined ? {} : { mediaType }),
  };
}

export function statFromNode(node: MemoryNode): t.FilesFs.Capability.Stat {
  return {
    kind: node.kind,
    isFile: node.kind === 'file',
    isDirectory: node.kind === 'dir',
    ...(node.kind === 'file' ? { size: node.size } : {}),
    ...(node.kind === 'file' && node.modifiedAt !== undefined
      ? { modifiedAt: node.modifiedAt }
      : {}),
    ...(node.kind === 'file' && node.hash !== undefined ? { hash: node.hash } : {}),
    ...(node.kind === 'file' && node.mediaType !== undefined ? { mediaType: node.mediaType } : {}),
  };
}

function optionalString(value: unknown, name: string): string | undefined {
  if (value === undefined) return undefined;
  if (Is.string(value)) return value;
  throw fail('FilesMemoryError.InvalidPath', `Memory file ${name} must be a string`);
}

function optionalTimestamp(value: unknown, name: string): t.UnixTimestamp | undefined {
  if (value === undefined) return undefined;
  if (Num.Is.finite(value)) return value as t.UnixTimestamp;
  throw fail('FilesMemoryError.InvalidPath', `Memory file ${name} must be a finite number`);
}
