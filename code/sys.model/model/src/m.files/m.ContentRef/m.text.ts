import { type t } from './common.ts';
import { bytes } from './m.bytes.ts';
import { decodeFailed, unsupportedEncoding, unsupportedRef } from './u.error.ts';

const UTF8: t.Files.Encoding = 'utf8';

/** Resolve a Files URL content ref to UTF-8 text. */
export async function text(
  ref: t.Files.ContentRef,
  options: t.Files.ContentRef.TextOptions = {},
): Promise<string> {
  if (ref.kind !== 'url') throw unsupportedRef('text', ref);

  const encoding = options.encoding ?? ref.encoding ?? UTF8;
  if (encoding !== UTF8) throw unsupportedEncoding(ref.path, encoding);

  const data = await bytes(ref, options);
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(data);
  } catch (cause) {
    throw decodeFailed(ref.path, cause);
  }
}
