import type { t } from './common.ts';
import { attachHandlers } from './u.attachHandlers.ts';

/**
 * Attach a CRDT command host for the given repo to a command endpoint.
 *
 * The host is torn down when the repo is disposed,
 * and the endpoint is closed at the same time.
 */
export const attachHost: t.CrdtCmdLib['attachHost'] = (repo, endpoint, until) => {
  const host = attachHandlers({ endpoint, repo });

  const events = repo.events(until);
  const sub = events.dispose$.subscribe(() => {
    host.dispose();
    endpoint.close?.();
    sub.unsubscribe?.();
  });

  return host;
};
