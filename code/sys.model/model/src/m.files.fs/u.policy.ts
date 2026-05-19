import { Glob, Is, type t } from './common.ts';
import { fail } from './u.error.ts';
import { snapshotMatch } from './u.match.ts';

export type PolicyAction = 'list' | 'stat' | 'read' | 'watch';

export const snapshotPolicy = (policy?: t.Files.Policy.Shape): t.Files.Policy.Shape => {
  const input = policy === undefined ? {} : policy;
  if (!Is.plainObject(input)) throw fail('FilesFsError.InvalidPath', 'Invalid Files policy');
  if (input.manifest !== undefined && !Is.bool(input.manifest)) {
    throw fail('FilesFsError.InvalidPath', 'Invalid Files manifest policy');
  }

  return Object.freeze({
    ...(input.list === undefined ? {} : { list: snapshotPolicyMatch(input.list) }),
    ...(input.stat === undefined ? {} : { stat: snapshotPolicyMatch(input.stat) }),
    ...(input.read === undefined ? {} : { read: snapshotPolicyMatch(input.read) }),
    ...(input.watch === undefined ? {} : { watch: snapshotPolicyMatch(input.watch) }),
    ...(input.manifest === undefined ? {} : { manifest: input.manifest }),
    ...(input.deny === undefined ? {} : { deny: snapshotPolicyMatch(input.deny) }),
    ...(input.maxReadBytes === undefined ? {} : { maxReadBytes: input.maxReadBytes }),
  });
};

export const allowed = (
  policy: t.Files.Policy.Shape,
  action: PolicyAction,
  path: t.Files.StringPath,
): boolean => {
  if (Glob.matches(policy.deny, path)) return false;
  return Glob.matches(policy[action], path);
};

export const manifestAllowed = (
  policy: t.Files.Policy.Shape,
  path: t.Files.StringPath,
): boolean => {
  if (Glob.matches(policy.deny, path)) return false;
  return policy.manifest === true;
};

const snapshotPolicyMatch = (match: unknown): t.Files.Match => {
  return snapshotMatch(match, 'Invalid Files policy match');
};
