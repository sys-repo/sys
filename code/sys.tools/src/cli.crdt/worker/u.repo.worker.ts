import { Crdt, Log, Fs } from '../common.ts';

/**
 * Single-repo worker host.
 */
Crdt.Worker.Host.listen(
  self,
  async ({ config }) => {
    if (!config || config.kind !== 'fs')
      throw new Error(`Configuration kind "${config?.kind}" not supported.`);

    const silent = config.silent;
    const info = Log.logger('crdt:worker', { timestamp: null, enabled: !silent });

    const dir = config.storage;
    const network = config.network || [];
    const repo = await Crdt.repo({ dir, network }).whenReady();

    info('Repo:');
    info(`- filesystem: ${dir}`);
    info(`Crdt.Worker.Host.listen: "${repo.id.instance}"`);
    network.forEach((e) => info(`- network: ${e.ws}`));
    repo.events().$.subscribe((e) => info('⚡️', e.type));

    return repo;
  },
  { Fs },
);
