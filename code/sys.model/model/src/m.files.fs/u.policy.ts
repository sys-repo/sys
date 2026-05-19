import {
  allowed,
  manifestAllowed,
  type PolicyAction,
  snapshotPolicy as snapshotFilesPolicy,
} from '../m.files/u.policy.ts';
import { type t } from './common.ts';
import { fail } from './u.error.ts';

export type { PolicyAction };
export { allowed, manifestAllowed };

const invalidPath = (message: string): Error => fail('FilesFsError.InvalidPath', message);

export const snapshotPolicy = (policy?: t.Files.Policy.Shape): t.Files.Policy.Shape => {
  return snapshotFilesPolicy(policy, invalidPath);
};
