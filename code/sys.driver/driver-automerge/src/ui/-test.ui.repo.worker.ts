import { Is } from '@sys/std/is';
import { Log } from '@sys/std';
import { Crdt } from '../-exports/-web/mod.ts';
import type { t } from './common.ts';

export const factory: t.CrdtRepoFactory = async ({ config }) => {
  if (config?.kind !== 'web') {
    throw new Error(`Unsupported worker config kind: "${config?.kind}"`);
  }
  const { storage, network } = config;
  const repo = Crdt.repo({
    storage,
    network,
  });

  const log = Log.logger('repo:worker', { timestamp: null });
  log(repo);
  log(`Crdt.Worker.Host.listen: "${repo.id.instance}"`);
  repo.events().$.subscribe((e) => log('⚡️', e));

  return await repo.whenReady();
};

/**
 * Start the CRDT worker message pump.
 */
if (Is.worker()) Crdt.Worker.Host.listen(self, factory);
else console.warn(`This file should have been run on a worker process`);
