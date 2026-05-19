import { type t } from './common.ts';
import { matches } from './u.glob.ts';

export type PolicyAction = 'list' | 'stat' | 'read' | 'watch';

export const allowed = (
  policy: t.Files.Policy.Shape,
  action: PolicyAction,
  path: t.Files.StringPath,
): boolean => {
  if (matches(policy.deny, path)) return false;
  return matches(policy[action], path);
};

export const manifestAllowed = (
  policy: t.Files.Policy.Shape,
  path: t.Files.StringPath,
): boolean => {
  if (matches(policy.deny, path)) return false;
  return policy.manifest === true;
};
