import { Crdt } from '@sys/driver-automerge/fs';
import { type t } from '../common.ts';

import { CrdtWorker } from '../mod.ts';

const factory: t.CrdtRepoFactory = async ({ config }) => {
  if (config?.kind !== 'fs') {
    throw new Error(`Unsupported worker config kind: "${config?.kind}"`);
  }

  const dir = config.storage ?? '.tmp/test/crdt-worker';
  const network = config.network || [];
  const repo = await Crdt.repo({ dir, network }).whenReady();
  return repo;
};

// Install the host listener using the factory (lazy repo creation).
CrdtWorker.Host.listen(self, factory);
