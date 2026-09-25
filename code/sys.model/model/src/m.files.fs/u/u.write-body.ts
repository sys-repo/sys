import { utf8ByteLength } from '../../m.files/u/u.bytes.ts';
import { D, Is, type t } from '../common.ts';
import { fail } from './u.error.ts';

export type WriteBody = {
  readonly bytes: Uint8Array;
  readonly mediaType?: t.StringMimeType;
};

/** Validate and encode a complete Files write payload before filesystem mutation. */
export const writeBody = (
  payload: t.Files.Cmd.Write.Payload,
  path: t.Files.String.Path,
  maxWriteBytes: t.NumberBytes | undefined,
): WriteBody => {
  const mediaType = optionalString(payload.mediaType, 'mediaType');

  if (payload.kind === 'text') {
    if (!Is.string(payload.content)) {
      throw fail('FilesFsError.InvalidPath', 'Files text write content must be a string');
    }
    if (payload.encoding !== undefined && payload.encoding !== D.encoding) {
      throw fail('FilesFsError.Unsupported', 'Unsupported Files write encoding');
    }
    const size = utf8ByteLength(payload.content);
    assertWriteSize(size, path, maxWriteBytes);
    const bytes = new TextEncoder().encode(payload.content);
    if (bytes.byteLength !== size) {
      throw fail('FilesFsError.Unsupported', 'Unsupported Files text encoding');
    }
    return { bytes, ...(mediaType === undefined ? {} : { mediaType }) };
  }

  if (payload.kind === 'bytes') {
    if (!Is.uint8Array(payload.content)) {
      throw fail('FilesFsError.InvalidPath', 'Files bytes write content must be Uint8Array');
    }
    const size = payload.content.byteLength as t.NumberBytes;
    assertWriteSize(size, path, maxWriteBytes);
    return {
      bytes: new Uint8Array(payload.content),
      ...(mediaType === undefined ? {} : { mediaType }),
    };
  }

  throw fail('FilesFsError.InvalidPath', 'Unsupported Files write payload kind');
};

export const assertWriteSize = (
  size: t.NumberBytes,
  path: t.Files.String.Path,
  maxWriteBytes: t.NumberBytes | undefined,
): void => {
  if (maxWriteBytes !== undefined && size > maxWriteBytes) {
    throw fail('FilesFsError.WriteTooLarge', `Write exceeds max bytes: ${path}`);
  }
};

const optionalString = (input: unknown, field: string): t.StringMimeType | undefined => {
  if (input === undefined) return undefined;
  if (!Is.string(input)) throw fail('FilesFsError.InvalidPath', `Invalid Files ${field}`);
  return input;
};
