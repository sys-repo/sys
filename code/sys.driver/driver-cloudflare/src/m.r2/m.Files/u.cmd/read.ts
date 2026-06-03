import { Bytes, type t } from '../common.ts';
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
      if (!isFilesText(object.metadata)) {
        const contentRef = urlRef(runtime, path, file);
        if (!contentRef) {
          throw fail('FilesR2Error.Unsupported', `Inline binary read unsupported: ${path}`);
        }
        return { kind: 'ref', file, contentRef };
      }

      const limit = minByteLimit(
        'Invalid Files read byte limit',
        payload.maxBytes,
        runtime.capabilities.maxReadBytes,
      );
      assertMaxBytes({
        size: object.size,
        max: limit,
        kind: 'FilesR2Error.ReadTooLarge',
        message: `Read exceeds max bytes: ${path}`,
      });

      const response = await runtime.bucket.read(key);
      const content = await response.text();
      assertMaxBytes({
        size: Bytes.utf8ByteLength(content),
        max: limit,
        kind: 'FilesR2Error.ReadTooLarge',
        message: `Read exceeds max bytes: ${path}`,
      });

      return { kind: 'inline', file, encoding: ENCODING, content };
    },
  });
}
