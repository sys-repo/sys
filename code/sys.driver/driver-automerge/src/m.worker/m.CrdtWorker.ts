import { type t, WIRE_VERSION as version } from './common.ts';

import { attachRepo as attach } from './u.attach.repo.ts';
import { listen } from './u.listen.ts';
import { createRepo as repo } from './u.proxy.repo.ts';
import { spawn } from './u.spawn.ts';

const Client: t.CrdtWorkerClientLib = {
  version,
  repo,
  spawn,
};

const Host: t.CrdtWorkerHostLib = {
  version,
  attach,
  listen,
};

export const CrdtWorker: t.CrdtWorkerLib = {
  version, // TEMP 🐷

  Client,
  Host,
};
