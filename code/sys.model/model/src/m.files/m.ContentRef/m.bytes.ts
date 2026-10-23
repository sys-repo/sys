import { type t } from './common.ts';
import { unsupportedRef } from './u.error.ts';
import { fetchBytes } from './u.fetch.ts';
import { verifyContent } from './u.verify.ts';

/** Resolve a Files URL content ref to bytes. */
export async function bytes(
  ref: t.Files.ContentRef,
  options: t.Files.ContentRef.Options = {},
): Promise<Uint8Array> {
  if (ref.kind !== 'url') throw unsupportedRef('bytes', ref);

  const data = await fetchBytes(ref, options);
  verifyContent(ref, data, options.verify);
  return data;
}
