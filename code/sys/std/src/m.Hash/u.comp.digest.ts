import type { t } from './common.ts';
import { Wrangle } from './u.wrangle.ts';

export const digest: t.CompositeHashLib['digest'] = (parts, options = {}) => {
  const hashes: string[] = [];
  Object.keys(parts)
    .sort()
    .forEach((key) => hashes.push(parts[key]));
  return Wrangle.hash(hashes.join('\n'), options.algo);
};
