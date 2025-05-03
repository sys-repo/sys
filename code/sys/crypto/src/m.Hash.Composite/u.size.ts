import { type t } from './common.ts';
import { FileHashUri } from './m.Uri.ts';

/**
 * Sums the total byte-size of the given parts.
 */
export const size = (parts: t.CompositeHashParts) => {
  const uris = Object.entries(parts)
    .map((value) => {
      const [path] = value;
      const uri = FileHashUri.fromUri(value[1]);
      return { path, uri };
    })
    .filter((m) => m.path.startsWith('pkg/'))
    .filter((m) => typeof m.uri.bytes === 'number');

  if (uris.length === 0) return undefined;

  return uris.reduce((acc, next) => {
    const { uri, path } = next;
    if (typeof uri.bytes !== 'number') return acc;
    if (!path.startsWith('pkg/')) return acc;
    return acc + uri.bytes;
  }, 0);
};
