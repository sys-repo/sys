import {
  snapshotMatch as snapshotFilesMatch,
  snapshotOptionalMatch as snapshotOptionalFilesMatch,
} from '../../m.files/u/u.match.ts';
import { type t } from '../common.ts';
import { fail } from './u.error.ts';

const invalidPath = (message: string): Error => fail('FilesFsError.InvalidPath', message);

export const snapshotMatch = (
  match: unknown,
  message = 'Invalid Files match',
): t.Files.Match => {
  return snapshotFilesMatch(match, invalidPath, message);
};

export const snapshotOptionalMatch = (
  match: unknown,
  message = 'Invalid Files match',
): t.Files.Match | undefined => {
  return snapshotOptionalFilesMatch(match, invalidPath, message);
};
