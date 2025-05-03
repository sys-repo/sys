import type { t } from './common.ts';
import { Wrangle } from './u.wrangle.ts';
import { FileHashUri } from './m.Uri.ts';

export const digest: t.CompositeHashLib['digest'] = (parts, options = {}) => {
  const hashes: string[] = [];
  Object.keys(parts)
    .sort()
    .map((key) => parts[key])
    .map((uri) => FileHashUri.fromUri(uri).hash)
    .forEach((hash) => hashes.push(hash));

  return Wrangle.hash(hashes.join('\n'), options.algo);
};
