import { type t, getRepoPort, CrdtIs } from './common.ts';
import { make } from './u.make.ts';

/**
 * Derive a command client from a CRDT repo.
 */
export const fromRepo: t.CrdtCmdLib['fromRepo'] = (repo) => {
  if (!CrdtIs.proxy(repo)) {
  }

  const port = getRepoPort(repo as t.CrdtRepoWorkerProxy);
  const cmd = make();
  return cmd.client(port);
};
