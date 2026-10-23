import { Hash, Is, type t } from './common.ts';
import { hashMismatch, hashUnsupported, sizeMismatch } from './u.error.ts';

type Verification = {
  readonly size: boolean;
  readonly hash: boolean;
};

/** Verify content bytes against integrity metadata carried by the URL ref. */
export function verifyContent(
  ref: t.Files.ContentRef.Url,
  data: Uint8Array,
  input: t.Files.ContentRef.Options['verify'],
) {
  const verify = verification(input);

  if (verify.size && !Is.nil(ref.size) && data.byteLength !== ref.size) {
    throw sizeMismatch(ref.path, ref.size, data.byteLength);
  }

  if (verify.hash && !Is.nil(ref.hash)) {
    const actual = digest(data, ref.hash, ref.path);
    if (actual !== ref.hash) throw hashMismatch(ref.path, ref.hash, actual);
  }
}

/**
 * Helpers:
 */
function verification(input: t.Files.ContentRef.Options['verify']): Verification {
  if (input === false) return { size: false, hash: false };
  if (input === true || input === undefined) return { size: true, hash: true };
  return { size: input.size ?? true, hash: input.hash ?? true };
}

function digest(data: Uint8Array, expected: t.StringHash, path: t.Files.String.Path): t.StringHash {
  const algorithm = Hash.prefix(expected);
  if (algorithm === 'sha256') return Hash.sha256(data);
  if (algorithm === 'sha1') return Hash.sha1(data);
  throw hashUnsupported(path, expected, algorithm);
}
