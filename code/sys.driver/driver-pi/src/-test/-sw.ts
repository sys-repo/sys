import { pkg } from '../pkg.ts';
import { Http } from '@sys/http/client';

const worker = globalThis as unknown as ServiceWorkerGlobalScope;
const deployment = Http.ServiceWorker.tombstone({ pkg });

/**
 * Only admitted non-loopback HTTPS deployment receives persistent cache authority.
 * Denied loopback deployment is handled by the inert tombstone installed above.
 */
if (deployment.kind === 'admitted') {
  void Http.Cache.pkg({ pkg });
  Http.Cache.Cmd.listen({
    target: worker,
    silent: false,
    ...Http.Cache.Cmd.Handlers.all({ pkg }),
  });
}
