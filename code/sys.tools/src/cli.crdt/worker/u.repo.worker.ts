import { Crdt, Log } from './common.ts';

const silent = false;
const info = Log.logger('crdt:worker', { timestamp: null, enabled: !silent });

/**
 * Single-repo worker host.
 */
Crdt.Worker.listen(self, async ({ config }) => {
  if (!config || config.kind !== 'fs')
    throw new Error(`Configuration kind "${config?.kind}" not supported.`);

  const dir = config.storage;
  const network = config.network || [];
  const repo = await Crdt.repo({ dir, network }).whenReady();

  info('Repo:');
  info(`- filesystem: ${dir}`);
  info(`Crdt.Worker.listen: "${repo.id.instance}"`);
  network.forEach((e) => info(`- network: ${e.ws}`));
  repo.events().$.subscribe((e) => info('⚡️', e.type));

  return repo;
});
