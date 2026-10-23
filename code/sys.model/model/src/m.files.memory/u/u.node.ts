import { utf8ByteLength } from '../../m.files/u/u.bytes.ts';
import { Is, type t } from '../common.ts';
import { fail } from './u.error.ts';
import { optionalString, optionalTimestamp } from './u.node.field.ts';

export type MemoryNode = MemoryDirNode | MemoryFileNode;
export type MemoryDirNode = { readonly kind: 'dir' };
export type MemoryFileNode = MemoryTextFileNode | MemoryBytesFileNode;

export type MemoryFileBase = {
  readonly kind: 'file';
  readonly size: t.NumberBytes;
  readonly modifiedAt?: t.UnixTimestamp;
  readonly hash?: t.StringHash;
  readonly mediaType?: t.StringMimeType;
};

export type MemoryTextFileNode = MemoryFileBase & {
  readonly body: 'text';
  readonly content: string;
};

export type MemoryBytesFileNode = MemoryFileBase & {
  readonly body: 'bytes';
  readonly content: Uint8Array;
};

export function fileNode(input: t.Files.Source.TextFileInput): MemoryTextFileNode {
  const file = Is.string(input) ? { content: input } : input;
  if (!Is.plainObject(file) || !Is.string(file.content)) {
    throw fail('FilesMemoryError.InvalidPath', 'Memory file content must be a string');
  }

  const modifiedAt = optionalTimestamp(file.modifiedAt, 'modifiedAt');
  const hash = optionalString(file.hash, 'hash');
  const mediaType = optionalString(file.mediaType, 'mediaType');

  return {
    kind: 'file',
    body: 'text',
    content: file.content,
    size: utf8ByteLength(file.content),
    ...(modifiedAt === undefined ? {} : { modifiedAt }),
    ...(hash === undefined ? {} : { hash }),
    ...(mediaType === undefined ? {} : { mediaType }),
  };
}

export function entryFromNode(path: t.Files.String.Path, node: MemoryNode): t.Files.Entry {
  const base = {
    path,
    kind: node.kind,
    ...(node.kind === 'file' && node.modifiedAt !== undefined
      ? { modifiedAt: node.modifiedAt }
      : {}),
    ...(node.kind === 'file' && node.hash !== undefined ? { hash: node.hash } : {}),
  };

  if (node.kind === 'dir') return { ...base, kind: 'dir' };
  return {
    ...base,
    kind: 'file',
    size: node.size,
    ...(node.mediaType === undefined ? {} : { mediaType: node.mediaType }),
  };
}
