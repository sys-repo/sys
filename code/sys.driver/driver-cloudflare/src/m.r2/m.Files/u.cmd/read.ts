import { MediaType, Num, type t } from '../common.ts';
import { fileEntryFromMeta } from '../u/entry.ts';
import { fail, provider } from '../u/error.ts';
import { ENCODING, isFilesText } from '../u/metadata.ts';
import { objectKey, requiredVisiblePath } from '../u/path.ts';
import { hasDescendants, type Runtime, urlRef } from '../u/runtime.ts';
import { assertMaxBytes, minByteLimit } from '../u/size.ts';

/** Implementation of the `files:read` command for R2 Files backings. */
export async function read(
  runtime: Runtime,
  payload: t.Files.Cmd.Read.Payload,
): Promise<t.Files.Cmd.Read.Result> {
  const path = requiredVisiblePath(payload.path);
  if (path === '') throw fail('FilesR2Error.NotFile', 'Not a file: ');

  const encoding = payload.encoding ?? ENCODING;
  if (encoding !== ENCODING) {
    throw fail('FilesR2Error.Unsupported', 'Unsupported Files read encoding');
  }

  return await provider({
    action: 'Read',
    path,
    async run() {
      const key = objectKey(runtime.prefix, path);
      const object = await runtime.bucket.stat(key);
      if (!object) {
        if (await hasDescendants(runtime, path)) {
          throw fail('FilesR2Error.NotFile', `Not a file: ${path}`);
        }
        throw fail('FilesR2Error.NotFound', `File not found: ${path}`);
      }
      if (await hasDescendants(runtime, path)) {
        throw fail('FilesR2Error.InvalidPath', `R2 object tree collision: ${path}`);
      }

      const file = fileEntryFromMeta(path, object);
      const limit = minByteLimit(
        'Invalid Files read byte limit',
        payload.maxBytes,
        runtime.capabilities.maxReadBytes,
      );

      if (!isFilesText(object.metadata)) {
        const contentRef = urlRef(runtime, path, file);
        if (contentRef) return { kind: 'ref', file, contentRef };
        if (!isTextualReadCandidate(path, file.mediaType)) {
          throw fail('FilesR2Error.Unsupported', `Inline binary read unsupported: ${path}`);
        }
      }

      if (Num.Is.finite(file.size)) {
        assertMaxBytes({
          size: file.size,
          max: limit,
          kind: 'FilesR2Error.ReadTooLarge',
          message: `Read exceeds max bytes: ${path}`,
        });
      }

      const response = await runtime.bucket.read(key);
      const bytes = await readResponseBytes(response, path, limit);
      const content = decodeUtf8Text(bytes, path);

      return { kind: 'inline', file, encoding: ENCODING, content };
    },
  });
}

function isTextualReadCandidate(
  path: t.Files.String.Path,
  mediaType: t.StringMimeType | undefined,
): boolean {
  const candidate = mediaType ?? MediaType.fromPath(path);
  return MediaType.Is.text(candidate);
}

async function readResponseBytes(
  response: Response,
  path: t.Files.String.Path,
  limit?: t.NumberBytes,
): Promise<Uint8Array> {
  const reader = response.body?.getReader();
  if (!reader) {
    const bytes = new Uint8Array(await response.arrayBuffer());
    assertMaxBytes({
      size: bytes.byteLength as t.NumberBytes,
      max: limit,
      kind: 'FilesR2Error.ReadTooLarge',
      message: `Read exceeds max bytes: ${path}`,
    });
    return bytes;
  }

  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value.byteLength) continue;
      size += value.byteLength;
      assertMaxBytes({
        size: size as t.NumberBytes,
        max: limit,
        kind: 'FilesR2Error.ReadTooLarge',
        message: `Read exceeds max bytes: ${path}`,
      });
      chunks.push(value);
    }
  } catch (error) {
    await reader.cancel(error).catch(() => undefined);
    throw error;
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

function decodeUtf8Text(bytes: Uint8Array, path: t.Files.String.Path): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch (cause) {
    throw fail('FilesR2Error.Unsupported', `Unsupported UTF-8 read content: ${path}`, cause);
  }
}
