import { type t, WIRE_VERSION } from './common.ts';

import { attach } from './u.attach.ts';
import { createRepo as repo } from './u.repo.ts';
import { listen } from './u.listen.ts';
import { spawn } from './u.spawn.ts';

export const CrdtWorker: t.CrdtWorkerLib = {
  version: WIRE_VERSION,
  repo,
  attach,
  spawn,
  listen,
};
