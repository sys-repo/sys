import { type t, WIRE_VERSION } from './common.ts';
import { createRepo as repo } from './u.createRepo.ts';

export const CrdtWorker: t.CrdtWorkerLib = {
  version: WIRE_VERSION,
  repo,
};
