import { Bytes, Is, type t } from '../common.ts';
import { fileEntry } from '../u/entry.ts';
import { fail, provider } from '../u/error.ts';
import { ENCODING, writeCustomMetadata } from '../u/metadata.ts';
import { ancestors, objectKey, requiredVisiblePath } from '../u/path.ts';
import { descendantObjects, type Runtime } from '../u/runtime.ts';
import { assertMaxBytes } from '../u/size.ts';

export type WriteBody = {
  readonly data: string | Uint8Array;
  readonly size: t.NumberBytes;
  readonly mediaType?: string;
  readonly custom: t.R2.MetadataCustom;
};

/** Implementation of the `files:write` command for R2 Files backings. */
export async function write(
  runtime: Runtime,
  payload: t.Files.Cmd.Write.Payload,
): Promise<t.Files.Cmd.Write.Result> {
  if (!Is.plainObject(payload)) {
    throw fail('FilesR2Error.InvalidPath', 'Files write payload must be a plain object');
  }

  const path = requiredVisiblePath(payload.path);
  if (path === '') throw fail('FilesR2Error.InvalidPath', 'Cannot write R2 Files root');
  const body = writeBody(payload, path, runtime.capabilities.maxWriteBytes);

  return await provider({
    action: 'Write',
    path,
    async run() {
      const key = objectKey(runtime.prefix, path);
      await assertWritablePath(runtime, path);
      const previous = await runtime.bucket.stat(key);
      await runtime.bucket.write(key, body.data, {
        size: body.size,
        ...(body.mediaType === undefined ? {} : { mediaType: body.mediaType }),
        custom: body.custom,
      });

      const entry = {
        ...fileEntry(path, { key, size: body.size }),
        ...(body.mediaType === undefined ? {} : { mediaType: body.mediaType }),
      };
      return {
        kind: previous ? 'modified' : 'created',
        path,
        ...(runtime.authority.allows('stat', path) ? { entry } : {}),
      };
    },
  });
}

/** Validate and encode a complete Files write payload. */
export function writeBody(
  payload: t.Files.Cmd.Write.Payload,
  path: t.Files.String.Path,
  maxWriteBytes: t.NumberBytes | undefined,
): WriteBody {
  const mediaType = optionalString(payload.mediaType, 'mediaType');

  if (payload.kind === 'text') {
    if (!Is.string(payload.content)) {
      throw fail('FilesR2Error.InvalidPath', 'Files text write content must be a string');
    }
    if (payload.encoding !== undefined && payload.encoding !== ENCODING) {
      throw fail('FilesR2Error.Unsupported', 'Unsupported Files write encoding');
    }
    const size = Bytes.utf8ByteLength(payload.content);
    assertWriteSize(size, path, maxWriteBytes);
    return {
      data: payload.content,
      size,
      ...(mediaType === undefined ? {} : { mediaType }),
      custom: writeCustomMetadata('text'),
    };
  }

  if (payload.kind === 'bytes') {
    if (!Is.uint8Array(payload.content)) {
      throw fail('FilesR2Error.InvalidPath', 'Files bytes write content must be Uint8Array');
    }
    const size = payload.content.byteLength as t.NumberBytes;
    assertWriteSize(size, path, maxWriteBytes);
    return {
      data: new Uint8Array(payload.content),
      size,
      ...(mediaType === undefined ? {} : { mediaType }),
      custom: writeCustomMetadata('bytes'),
    };
  }

  throw fail('FilesR2Error.InvalidPath', 'Unsupported Files write payload kind');
}

async function assertWritablePath(runtime: Runtime, path: t.Files.String.Path): Promise<void> {
  for (const ancestor of ancestors(path)) {
    const object = await runtime.bucket.stat(objectKey(runtime.prefix, ancestor));
    if (object) throw fail('FilesR2Error.NotDirectory', `Not a directory: ${ancestor}`);
  }
  const descendants = await descendantObjects(runtime, path, 1);
  if (descendants.length > 0) throw fail('FilesR2Error.NotFile', `Not a file: ${path}`);
}

function assertWriteSize(
  size: t.NumberBytes,
  path: t.Files.String.Path,
  maxWriteBytes: t.NumberBytes | undefined,
): void {
  assertMaxBytes({
    size,
    max: maxWriteBytes,
    kind: 'FilesR2Error.WriteTooLarge',
    message: `Write exceeds max bytes: ${path}`,
  });
}

function optionalString(input: unknown, field: string): string | undefined {
  if (input === undefined) return undefined;
  if (!Is.string(input)) throw fail('FilesR2Error.InvalidPath', `Invalid Files ${field}`);
  return input;
}
