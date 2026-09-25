import { Is, type t } from '../common.ts';

export type FilesInvalid = (message: string) => Error;

/** Snapshot and validate a Files path match selector. */
export const snapshotMatch = (
  match: unknown,
  invalid: FilesInvalid,
  message = 'Invalid Files match',
): t.Files.Match => {
  if (Is.string(match)) return match;
  if (Is.array(match) && match.every((item) => Is.string(item))) {
    return Object.freeze([...match]);
  }
  throw invalid(message);
};

/** Snapshot and validate an optional Files path match selector. */
export const snapshotOptionalMatch = (
  match: unknown,
  invalid: FilesInvalid,
  message = 'Invalid Files match',
): t.Files.Match | undefined => {
  return match === undefined ? undefined : snapshotMatch(match, invalid, message);
};
