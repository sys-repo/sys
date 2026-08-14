import { type t } from '../common.ts';
import { fromRef } from './u.fromRef.ts';
import { fromNameStatus } from './u.fromNameStatus.ts';

/**
 * Git-backed workspace delta adapters.
 */
export const Git: t.WorkspaceDelta.Git.Lib = Object.freeze({ fromNameStatus, fromRef });
