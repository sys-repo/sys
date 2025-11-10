import { type t } from './common.ts';
import { createRepo as repo } from './u.createRepo.ts';

export const CrdtWorker: t.CrdtWorkerLib = {
  repo,
};
