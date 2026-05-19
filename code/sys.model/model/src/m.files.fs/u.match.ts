import { Is, type t } from './common.ts';
import { fail } from './u.error.ts';

export const snapshotMatch = (
  match: unknown,
  message = 'Invalid Files match',
): t.Files.Match => {
  if (Is.string(match)) return match;
  if (Is.array(match) && match.every((item) => Is.string(item))) {
    return Object.freeze([...match]);
  }
  throw fail('FilesFsError.InvalidPath', message);
};

export const snapshotOptionalMatch = (
  match: unknown,
  message = 'Invalid Files match',
): t.Files.Match | undefined => {
  return match === undefined ? undefined : snapshotMatch(match, message);
};
