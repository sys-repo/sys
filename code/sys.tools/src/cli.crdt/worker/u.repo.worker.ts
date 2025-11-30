import { Crdt, Is, Log } from '../common.ts';

/**
 * Global error and rejection traps so that unhandled failures inside the
 * worker (e.g. websocket ECONNREFUSED/ETIMEDOUT) do not tear down the
 * parent daemon process.
 *
 * Instead, we log them via the standard worker logger and prevent the
 * default error behaviour that would otherwise surface as
 * "Unhandled error in child worker".
 */
const workerLog = Log.logger('crdt:worker', { timestamp: null, enabled: true });

self.addEventListener('error', (event) => {
  event.preventDefault();
  workerLog('Unhandled error in worker:', event.message);
});

self.addEventListener('unhandledrejection', (event) => {
  event.preventDefault();
  workerLog('Unhandled rejection in worker:', String(event.reason));
});

function isNetworkFailure(err: unknown): boolean {
  const msg = String(err);
  return (
    msg.includes('ECONNREFUSED') ||
    msg.includes('ETIMEDOUT') ||
    msg.includes('EHOSTUNREACH') ||
    msg.includes('ENETUNREACH') ||
    msg.includes('connect ECONNREFUSED') ||
    msg.includes('connect ETIMEDOUT')
  );
}

/**
 * Single-repo worker host.
 */
Crdt.Worker.Host.listen(self, async ({ config }) => {
  if (!config || config.kind !== 'fs')
    throw new Error(`Configuration kind "${config?.kind}" not supported.`);

  const silent = config.silent;
  const info = Log.logger('crdt:worker', { timestamp: null, enabled: !silent });

  const dir = config.storage;
  const network = config.network || [];

  const repo = await (async () => {
    try {
      return await Crdt.repo({ dir, network }).whenReady();
    } catch (err) {
      if (isNetworkFailure(err)) {
        info('Network sync unavailable, starting repo in offline mode.');
        return await Crdt.repo({ dir, network: [] }).whenReady();
      }
      throw err;
    }
  })();

  info(`Crdt.Worker.Host.listen: "${repo.id.instance}"`);
  info('Repo:');
  info(`- filesystem: ${dir}`);
  network.filter((e) => Is.record(e)).forEach((e) => info(`- network: ${e.ws}`));
  repo.events().$.subscribe((e) => info('⚡️', e.type));

  return repo;
});
