import { type t, WIRE_VERSION } from './common.ts';

import { attach } from './u.attach.ts';
import { doc } from './u.proxy.doc.ts';
import { listen } from './u.listen.ts';
import { createRepo as repo } from './u.proxy.repo.ts';
import { spawn } from './u.spawn.ts';

export const CrdtWorker: t.CrdtWorkerLib = {
  version: WIRE_VERSION,
  repo,
  doc,
  attach,
  spawn,
  listen,
};
