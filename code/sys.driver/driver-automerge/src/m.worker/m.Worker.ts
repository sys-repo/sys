import { type t, WIRE_VERSION as version } from './common.ts';

import { attachRepo as attach } from './u.host.attach.repo.ts';
import { listen } from './u.host.listen.ts';
import { createRepo as repo } from './u.client.proxy.repo.ts';
import { spawn } from './u.client.spawn.ts';

export const CrdtWorker: t.CrdtWorkerLib = {
  version,
  Client: { repo, spawn },
  Host: { attach, listen },
};
