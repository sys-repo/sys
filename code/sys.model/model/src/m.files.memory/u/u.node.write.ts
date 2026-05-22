import { utf8ByteLength } from '../../m.files/u/u.bytes.ts';
import { Is, type t } from '../common.ts';
import { fail } from './u.error.ts';
import { optionalString } from './u.node.field.ts';
import { type MemoryFileNode } from './u.node.ts';

type WriteFileNodeOptions = {
  readonly path: t.Files.String.Path;
  readonly maxWriteBytes?: t.NumberBytes;
};

/** Build a memory file node from a complete `files:write` payload. */
export function writeFileNode(
  payload: t.Files.Cmd.Write.Payload,
  options: WriteFileNodeOptions,
): MemoryFileNode {
  const mediaType = optionalString(payload.mediaType, 'mediaType');

  if (payload.kind === 'text') {
    if (!Is.string(payload.content)) {
      throw fail('FilesMemoryError.InvalidPath', 'Memory text write content must be a string');
    }
    if (payload.encoding !== undefined && payload.encoding !== 'utf8') {
      throw fail('FilesMemoryError.Unsupported', 'Unsupported Files write encoding');
    }
    const size = utf8ByteLength(payload.content);
    assertWriteSize(size, options);
    return {
      kind: 'file',
      body: 'text',
      content: payload.content,
      size,
      ...(mediaType === undefined ? {} : { mediaType }),
    };
  }

  if (payload.kind === 'bytes') {
    if (!Is.uint8Array(payload.content)) {
      throw fail('FilesMemoryError.InvalidPath', 'Memory bytes write content must be Uint8Array');
    }
    const size = payload.content.byteLength as t.NumberBytes;
    assertWriteSize(size, options);
    return {
      kind: 'file',
      body: 'bytes',
      content: new Uint8Array(payload.content),
      size,
      ...(mediaType === undefined ? {} : { mediaType }),
    };
  }

  throw fail('FilesMemoryError.InvalidPath', 'Unsupported Files write payload kind');
}

function assertWriteSize(size: t.NumberBytes, options: WriteFileNodeOptions): void {
  if (options.maxWriteBytes !== undefined && size > options.maxWriteBytes) {
    throw fail('FilesMemoryError.WriteTooLarge', `Write exceeds max bytes: ${options.path}`);
  }
}
