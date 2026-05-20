import {
  allowed,
  manifestAllowed,
  type PolicyAction,
  snapshotPolicy as snapshotFilesPolicy,
} from '../../m.files/u/u.policy.ts';
import { type t } from '../common.ts';
import { invalidPath } from './u.path.ts';

export type { PolicyAction };
export { allowed, manifestAllowed };

/** Snapshot a memory Files policy so caller mutation cannot widen authority. */
export const snapshotPolicy = (policy?: t.FilesPolicy.Shape): t.FilesPolicy.Shape => {
  return snapshotFilesPolicy(policy, invalidPath);
};
