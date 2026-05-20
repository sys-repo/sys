import { Glob, Is, type t } from './common.ts';
import { snapshotMatch } from './u.match.ts';

export type FilesInvalid = (message: string) => Error;
export type PolicyAction = 'list' | 'stat' | 'read' | 'watch';

/** Snapshot a Files policy so caller mutation cannot widen authority. */
export const snapshotPolicy = (
  policy: t.FilesPolicy.Shape | undefined,
  invalid: FilesInvalid,
): t.FilesPolicy.Shape => {
  const input = policy === undefined ? {} : policy;
  if (!Is.plainObject(input)) throw invalid('Invalid Files policy');
  if (input.manifest !== undefined && !Is.bool(input.manifest)) {
    throw invalid('Invalid Files manifest policy');
  }

  return Object.freeze({
    ...(input.list === undefined ? {} : { list: snapshotPolicyMatch(input.list, invalid) }),
    ...(input.stat === undefined ? {} : { stat: snapshotPolicyMatch(input.stat, invalid) }),
    ...(input.read === undefined ? {} : { read: snapshotPolicyMatch(input.read, invalid) }),
    ...(input.watch === undefined ? {} : { watch: snapshotPolicyMatch(input.watch, invalid) }),
    ...(input.manifest === undefined ? {} : { manifest: input.manifest }),
    ...(input.deny === undefined ? {} : { deny: snapshotPolicyMatch(input.deny, invalid) }),
    ...(input.maxReadBytes === undefined ? {} : { maxReadBytes: input.maxReadBytes }),
  });
};

/** True when a policy allows the action for the visible Files path. */
export const allowed = (
  policy: t.FilesPolicy.Shape,
  action: PolicyAction,
  path: t.Files.StringPath,
): boolean => {
  if (Glob.matches(policy.deny, path)) return false;
  return Glob.matches(policy[action], path);
};

/** True when a policy allows manifest projection for the visible Files path. */
export const manifestAllowed = (
  policy: t.FilesPolicy.Shape,
  path: t.Files.StringPath,
): boolean => {
  if (Glob.matches(policy.deny, path)) return false;
  return policy.manifest === true;
};

const snapshotPolicyMatch = (match: unknown, invalid: FilesInvalid): t.Files.Match => {
  return snapshotMatch(match, invalid, 'Invalid Files policy match');
};
