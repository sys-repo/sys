import { Glob, Is, type t } from '../common.ts';
import { snapshotMatch } from './u.match.ts';

export type FilesInvalid = (message: string) => Error;
export type PolicyAction = 'list' | 'stat' | 'read' | 'write' | 'remove' | 'watch';

/** Snapshot a Files policy so caller mutation cannot widen authority. */
export const snapshotPolicy = (
  policy: t.Files.Policy.Shape | undefined,
  invalid: FilesInvalid,
): t.Files.Policy.Shape => {
  const input = policy === undefined ? {} : policy;
  if (!Is.plainObject(input)) throw invalid('Invalid Files policy');
  if (input.manifest !== undefined && !Is.bool(input.manifest)) {
    throw invalid('Invalid Files manifest policy');
  }

  return Object.freeze({
    ...(input.list === undefined ? {} : { list: snapshotPolicyMatch(input.list, invalid) }),
    ...(input.stat === undefined ? {} : { stat: snapshotPolicyMatch(input.stat, invalid) }),
    ...(input.read === undefined ? {} : { read: snapshotPolicyMatch(input.read, invalid) }),
    ...(input.write === undefined ? {} : { write: snapshotPolicyMatch(input.write, invalid) }),
    ...(input.remove === undefined ? {} : { remove: snapshotPolicyMatch(input.remove, invalid) }),
    ...(input.watch === undefined ? {} : { watch: snapshotPolicyMatch(input.watch, invalid) }),
    ...(input.manifest === undefined ? {} : { manifest: input.manifest }),
    ...(input.deny === undefined ? {} : { deny: snapshotPolicyMatch(input.deny, invalid) }),
    ...(input.maxReadBytes === undefined ? {} : { maxReadBytes: input.maxReadBytes }),
    ...(input.maxWriteBytes === undefined ? {} : { maxWriteBytes: input.maxWriteBytes }),
  });
};

/** True when a policy allows the action for the visible Files path. */
export const allowed = (
  policy: t.Files.Policy.Shape,
  action: PolicyAction,
  path: t.Files.String.Path,
): boolean => {
  if (Glob.matches(policy.deny, path)) return false;
  return Glob.matches(policy[action], path);
};

/** True when a policy allows manifest projection for the visible Files path. */
export const manifestAllowed = (
  policy: t.Files.Policy.Shape,
  path: t.Files.String.Path,
): boolean => {
  if (Glob.matches(policy.deny, path)) return false;
  return policy.manifest === true;
};

const snapshotPolicyMatch = (match: unknown, invalid: FilesInvalid): t.Files.Match => {
  return snapshotMatch(match, invalid, 'Invalid Files policy match');
};
