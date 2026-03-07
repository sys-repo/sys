import { type t, CMD_VERSION as version } from './common.ts';

import { attach } from './u.host.attach.ts';
import { listen } from './u.host.listen.ts';
import { createRepo as repo } from './u.client.repo.ts';
import { spawn } from './u.client.spawn.ts';
import { make } from './u.make.ts';

/**
 * Cmd-based web-worker transport layer for the CRDT repo.
 * Replaces the bespoke wire protocol in m.worker with the generic Cmd system.
 *
 * Hybrid approach:
 * - RPC operations via Cmd system (repo:ready, repo:create, etc.)
 * - High-frequency events stay as direct postMessage for performance
 */
export const CrdtWorkerCmd: t.CrdtWorkerCmdLib = {
  version,
  make,
  Client: { repo, spawn },
  Host: { attach, listen },
};
