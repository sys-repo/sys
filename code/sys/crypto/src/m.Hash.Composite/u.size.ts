import { type t } from './common.ts';
import { FileHashUri } from './m.Uri.ts';

/**
 * Sums the total byte-size of the given parts.
 */
export const size: t.CompositeHashLib['size'] = (parts, filter) => {
  const uris = Object.entries(parts)
    .map((value) => ({ path: value[0], uri: FileHashUri.fromUri(value[1]) }))
    .filter((args) => filter?.(args) ?? true)
    .filter((args) => typeof args.uri.bytes === 'number');

  if (uris.length === 0) return undefined;

  return uris.reduce((acc, { uri }) => {
    if (typeof uri.bytes !== 'number') return acc;
    return acc + uri.bytes;
  }, 0);
};
