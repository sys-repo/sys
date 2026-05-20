import { utf8ByteLength } from '../../m.files/u/u.bytes.ts';
import { Is, type t } from '../common.ts';
import { fail } from './u.error.ts';
import { optionalString } from './u.node.field.ts';
import { type MemoryFileNode } from './u.node.ts';

/** Build a memory file node from a complete `files:write` payload. */
export function writeFileNode(payload: t.FilesCmd.Write.Payload): MemoryFileNode {
  const mediaType = optionalString(payload.mediaType, 'mediaType');

  if (payload.kind === 'text') {
    if (!Is.string(payload.content)) {
      throw fail('FilesMemoryError.InvalidPath', 'Memory text write content must be a string');
    }
    if (payload.encoding !== undefined && payload.encoding !== 'utf8') {
      throw fail('FilesMemoryError.Unsupported', 'Unsupported Files write encoding');
    }
    return {
      kind: 'file',
      body: 'text',
      content: payload.content,
      size: utf8ByteLength(payload.content),
      ...(mediaType === undefined ? {} : { mediaType }),
    };
  }

  if (payload.kind === 'bytes') {
    if (!Is.uint8Array(payload.content)) {
      throw fail('FilesMemoryError.InvalidPath', 'Memory bytes write content must be Uint8Array');
    }
    return {
      kind: 'file',
      body: 'bytes',
      content: new Uint8Array(payload.content),
      size: payload.content.byteLength as t.NumberBytes,
      ...(mediaType === undefined ? {} : { mediaType }),
    };
  }

  throw fail('FilesMemoryError.InvalidPath', 'Unsupported Files write payload kind');
}
