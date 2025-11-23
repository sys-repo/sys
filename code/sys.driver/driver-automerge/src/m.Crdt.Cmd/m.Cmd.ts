import type { t } from './common.ts';
import { fromRepo } from './u.fromRepo.ts';
import { make } from './u.make.ts';

/**
 * Transport-agnostic command API for CRDT repos.
 * Unified RPC layer for both local and worker-backed repos.
 */
export const CrdtCmd: t.CrdtCmdLib = {
  make,
  fromRepo,
};
