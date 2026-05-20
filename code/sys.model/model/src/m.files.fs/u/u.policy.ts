import {
  allowed,
  manifestAllowed,
  type PolicyAction,
  snapshotPolicy as snapshotFilesPolicy,
} from '../../m.files/u/u.policy.ts';
import { type t } from '../common.ts';
import { fail } from './u.error.ts';

export type { PolicyAction };
export { allowed, manifestAllowed };

const invalidPath = (message: string): Error => fail('FilesFsError.InvalidPath', message);

export const snapshotPolicy = (policy?: t.FilesPolicy.Shape): t.FilesPolicy.Shape => {
  return snapshotFilesPolicy(policy, invalidPath);
};
