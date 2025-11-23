import { type t, getRepoPort, CrdtIs } from './common.ts';
import { make } from './u.make.ts';
import { attachCmdHostToPort } from './u.host.ts';

/**
 * Derive a command client from a CRDT repo.
 *
 * - Worker-backed: reuse the existing control MessagePort.
 * - Local: create a synthetic MessageChannel, attach a command host
 *   to one side, and return a client on the other.
 *
 * In both cases, the command client is disposed when the repo is disposed.
 * For local repos we also close the ports and dispose the host.
 */
export const fromRepo: t.CrdtCmdLib['fromRepo'] = (repo) => {
  return CrdtIs.proxy(repo) ? fromProxyRepo(repo) : fromConcreteRepo(repo);
};

/**
 * Internal:
 */
function fromProxyRepo(repo: t.Crdt.Repo) {
  const cmd = make();
  const port = getRepoPort(repo as t.CrdtRepoWorkerProxy);
  const client = cmd.client(port);
  repo.events().dispose$.subscribe(() => client.dispose());
  return client;
}

function fromConcreteRepo(repo: t.Crdt.Repo) {
  const { port1, port2 } = new MessageChannel();
  const host = attachCmdHostToPort(port1, () => repo);
  const cmd = make();
  const client = cmd.client(port2);

  function teardown() {
    host.dispose();
    client.dispose();
    port1.close();
    port2.close();
  }

  repo.events().dispose$.subscribe(teardown);
  return client;
}
